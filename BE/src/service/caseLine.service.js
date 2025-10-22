import { Transaction } from "sequelize";
import { ConflictError, NotFoundError } from "../error/index.js";
import db from "../models/index.cjs";
import { allocateStock } from "../util/allocateStock.js";
import guaranteeCaseToCreateCaseLinesValidator from "../validators/guaranteeCaseToCreateCaseLines.validatior.js";

class CaseLineService {
  #caselineRepository;
  #componentReservationRepository;
  #guaranteeCaseRepository;
  #warehouseRepository;
  #componentRepository;
  #taskAssignmentRepository;
  #userRepository;
  #warehouseService;

  constructor({
    caselineRepository,
    componentReservationRepository,
    guaranteeCaseRepository,
    warehouseRepository,
    componentRepository,
    taskAssignmentRepository,
    userRepository,
    warehouseService,
  }) {
    this.#caselineRepository = caselineRepository;
    this.#componentReservationRepository = componentReservationRepository;
    this.#guaranteeCaseRepository = guaranteeCaseRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#componentRepository = componentRepository;
    this.#taskAssignmentRepository = taskAssignmentRepository;
    this.#userRepository = userRepository;
    this.#warehouseService = warehouseService;
  }

  createCaseLines = async ({
    guaranteeCaseId,
    caselines,
    serviceCenterId,
    techId,
    companyId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (t) => {
      const guaranteeCase = await this.#guaranteeCaseRepository.findDetailById(
        { guaranteeCaseId: guaranteeCaseId },
        t
      );

      if (!guaranteeCase) {
        throw new NotFoundError("Guarantee case not found");
      }

      const isTechMain = techId === guaranteeCase.leadTechId;

      if (!isTechMain) {
        throw new ConflictError(
          "Technician is not the main technician for caselines"
        );
      }

      const { error } = guaranteeCaseToCreateCaseLinesValidator.validate({
        status: guaranteeCase.status,
      });

      if (error) {
        throw new ConflictError(
          `Guarantee case status is not valid for creating caselines: ${error.message}`
        );
      }

      const components =
        await this.#warehouseService.searchCompatibleComponentsInStock({
          serviceCenterId: serviceCenterId,
          modelId:
            guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId,
          vin: guaranteeCase?.vehicleProcessingRecord?.vehicle?.vin,
          odometer: guaranteeCase?.vehicleProcessingRecord?.odometer,
          companyId: companyId,
        });

      const componentsFormat = components.map((component) => {
        return {
          typeComponentId: component.typeComponentId,
          isUnderWarranty: component.isUnderWarranty || false,
        };
      });

      const componentsMap = new Map();
      componentsFormat.forEach((component) => {
        componentsMap.set(component.typeComponentId, component.isUnderWarranty);
      });

      for (const caseline of caselines) {
        if (componentsMap.has(caseline.componentId)) {
          const isUnderWarranty = caseline.warrantyStatus === "ELIGIBLE";

          if (componentsMap.get(caseline.componentId) === isUnderWarranty) {
            continue;
          } else {
            throw new ConflictError(
              `Component warranty status mismatch for componentId: ${caseline.componentId}`
            );
          }
        }
      }

      const dataCaselines = caselines.map((caseline) => ({
        ...caseline,
        guaranteeCaseId: guaranteeCaseId,
        diagnosticTechId: techId,
      }));

      const newCaseLines = await this.#caselineRepository.bulkCreate(
        { caselines: dataCaselines },
        t
      );

      if (!newCaseLines || newCaseLines.length === 0) {
        return;
      }

      const updatedGuaranteeCase =
        await this.#guaranteeCaseRepository.updateStatus(
          {
            guaranteeCaseId: guaranteeCaseId,
            status: "DIAGNOSED",
          },
          t
        );
      if (!updatedGuaranteeCase) {
        throw new ConflictError("Failed to update guarantee case status");
      }

      return newCaseLines;
    });

    return rawResult;
  };

  allocateStockForCaseline = async ({ caselineId }) => {
    return await db.sequelize.transaction(async (t) => {
      const caseline = await this.#caselineRepository.findById(
        { caselineId: caselineId },
        t,
        t.LOCK.UPDATE
      );

      if (!caseline) {
        throw new NotFoundError("Caseline not found");
      }

      if (caseline.status !== "CUSTOMER_APPROVED") {
        throw new ConflictError(
          "Caseline must be CUSTOMER_APPROVED to allocate stock"
        );
      }

      const guaranteeCase = await this.#guaranteeCaseRepository.findById(
        { guaranteeCaseId: caseline.guaranteeCaseId },
        t
      );

      if (!guaranteeCase) {
        throw new NotFoundError("Guarantee case not found");
      }

      const stocks =
        await this.#warehouseRepository.findStocksByTypeComponentOrderByWarehousePriority(
          {
            typeComponentIds: [caseline.typeComponentId],
            serviceCenterId:
              guaranteeCase.vehicleProcessingRecord?.createdByStaff
                ?.serviceCenterId,
            vehicleModelId:
              guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId,
          },
          t,
          Transaction.LOCK.UPDATE
        );

      if (stocks.length === 0) {
        return null;
      }

      const totalAvailable = stocks.reduce(
        (total, stock) => total + stock.quantityAvailable,
        0
      );

      if (totalAvailable < caseline.quantity) {
        throw new ConflictError("Insufficient stock available for allocation");
      }

      const reservations = this.#allocateStock({
        stocks,
        quantity: caseline.quantity,
      });

      if (reservations.length === 0) {
        throw new ConflictError("Failed to allocate stock for caseline");
      }

      const stocksMap = new Map();
      for (const stock of stocks) {
        stocksMap.set(stock.stockId, stock);
      }

      const allComponents = [];
      for (const reservation of reservations) {
        const stock = stocksMap.get(reservation.stockId);

        if (!stock) {
          throw new NotFoundError(
            `Stock with ID ${reservation.stockId} not found`
          );
        }

        const components =
          await this.#componentRepository.findAvailableComponents(
            {
              typeComponentId: caseline.typeComponentId,
              warehouseId: stock.warehouseId,
              limit: reservation.quantity,
            },
            t,
            Transaction.LOCK.UPDATE
          );

        if (components.length < reservation.quantity) {
          throw new ConflictError(
            `Insufficient available components in warehouse ${stock.warehouseId}. ` +
              `Requested: ${reservation.quantity}, Available: ${components.length}`
          );
        }

        allComponents.push(...components);
      }

      const componentIds = allComponents.map(
        (component) => component.componentId
      );

      const stockUpdates = reservations.map((reservation) => ({
        stockId: reservation.stockId,
        quantityReserved: reservation.quantity,
      }));

      const componentReservationsToCreate = componentIds.map((componentId) => ({
        caselineId: caselineId,
        componentId: componentId,
      }));

      await this.#componentReservationRepository.bulkCreate(
        { componentReservations: componentReservationsToCreate },
        t
      );

      await this.#warehouseRepository.bulkUpdateStockQuantities(
        { reservations: stockUpdates },
        t
      );

      await this.#componentRepository.bulkUpdateStatus(
        {
          componentIds: componentIds,
          status: "RESERVED",
        },
        t
      );

      await this.#caselineRepository.bulkUpdateStatusByIds(
        {
          caseLineIds: [caselineId],
          status: "READY_FOR_REPAIR",
        },
        t
      );

      return {
        caseline: {
          caselineId: caselineId,
          status: "READY_FOR_REPAIR",
        },
        allocatedComponents: allComponents.length,
        allocations: reservations.map((r) => {
          const stock = stocks.find((s) => s.stockId === r.stockId);
          return {
            warehouseId: stock.warehouseId,
            warehouseName: stock.warehouse?.name,
            quantity: r.quantity,
          };
        }),
      };
    });
  };

  #allocateStock = ({ stocks, quantity }) => {
    // const singleStockSource = stocks.find(
    //   (stock) => stock.quantityAvailable >= quantity
    // );

    // if (singleStockSource) {
    //   return [{ stockId: singleStockSource.stockId, quantity: quantity }];
    // }

    let quantityNeed = quantity;
    const reservations = [];
    for (const stock of stocks) {
      const quantityCantake = Math.min(quantityNeed, stock.quantityAvailable);

      if (quantityCantake) {
        reservations.push({
          stockId: stock.stockId,
          quantity: quantityCantake,
        });

        quantityNeed -= quantityCantake;
      }

      if (quantityNeed <= 0) {
        return reservations;
      }
    }

    return reservations;
  };

  assignTechnicianToCaseline = async ({
    caselineId,
    technicianId,
    serviceCenterId,
  }) => {
    return await db.sequelize.transaction(async (t) => {
      const caseline = await this.#caselineRepository.findById(
        { caselineId },
        t,
        Transaction.LOCK.UPDATE
      );

      if (!caseline) {
        throw new NotFoundError("Caseline not found");
      }

      if (caseline.status !== "READY_FOR_REPAIR") {
        throw new ConflictError(
          `Caseline must be READY_FOR_REPAIR to assign technician. Current status: ${caseline.status}`
        );
      }

      const existingAssignment =
        await this.#taskAssignmentRepository.findByCaselineId(
          { caselineId },
          t
        );

      if (existingAssignment) {
        throw new ConflictError(
          `Technician already assigned to this caseline. Current assignee: ${existingAssignment.technicianId}`
        );
      }

      const technician = await this.#userRepository.findUserById(
        { userId: technicianId },
        t
      );

      if (!technician) {
        throw new NotFoundError("Technician not found");
      }

      if (technician.serviceCenterId !== serviceCenterId) {
        throw new ConflictError(
          "Technician does not belong to this service center"
        );
      }

      if (technician.roleId !== "service_center_technician") {
        throw new ConflictError(
          "User is not a technician. Role must be service_center_technician"
        );
      }

      const taskAssignment =
        await this.#taskAssignmentRepository.createTaskAssignmentForCaseline(
          {
            caselineId,
            technicianId,
            taskType: "REPAIR",
          },
          t
        );

      if (!taskAssignment) {
        throw new ConflictError("Failed to create task assignment");
      }

      await this.#caselineRepository.bulkUpdateStatusByIds(
        {
          caseLineIds: [caselineId],
          status: "IN_PROGRESS",
        },
        t
      );

      return {
        caseline: {
          caselineId,
          status: "IN_PROGRESS",
        },
        assignment: {
          taskAssignmentId: taskAssignment.taskAssignmentId,
          technicianId: taskAssignment.technicianId,
          technicianName: technician.name,
          taskType: taskAssignment.taskType,
          status: taskAssignment.status,
        },
      };
    });
  };
}

export default CaseLineService;
