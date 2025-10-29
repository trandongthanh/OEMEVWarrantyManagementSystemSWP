import { Transaction } from "sequelize";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../error/index.js";
import db from "../models/index.cjs";
import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";
import dayjs from "dayjs";

class CaseLineService {
  #caselineRepository;
  #componentReservationRepository;
  #guaranteeCaseRepository;
  #warehouseRepository;
  #componentRepository;
  #taskAssignmentRepository;
  #userRepository;
  #warehouseService;
  #vehicleProcessingRecordRepository;
  #notificationService;

  constructor({
    caselineRepository,
    componentReservationRepository,
    guaranteeCaseRepository,
    warehouseRepository,
    componentRepository,
    taskAssignmentRepository,
    userRepository,
    warehouseService,
    vehicleProcessingRecordRepository,
    notificationService,
  }) {
    this.#caselineRepository = caselineRepository;
    this.#componentReservationRepository = componentReservationRepository;
    this.#guaranteeCaseRepository = guaranteeCaseRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#componentRepository = componentRepository;
    this.#taskAssignmentRepository = taskAssignmentRepository;
    this.#userRepository = userRepository;
    this.#warehouseService = warehouseService;
    this.#vehicleProcessingRecordRepository = vehicleProcessingRecordRepository;
    this.#notificationService = notificationService;
  }

  createCaseLines = async ({
    guaranteeCaseId,
    caselines,
    serviceCenterId,
    roleName,
    techId,
    companyId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const guaranteeCase = await this.#validateGuaranteeCaseForCaseLines(
        guaranteeCaseId,
        transaction,
        techId
      );

      const typeComponents =
        await this.#warehouseService.searchCompatibleComponentsInStock({
          serviceCenterId: serviceCenterId,
          modelId:
            guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId,
          vin: guaranteeCase?.vehicleProcessingRecord?.vehicle?.vin,
          odometer: guaranteeCase?.vehicleProcessingRecord?.odometer,
          companyId: companyId,
        });

      const typeComponentsMap = new Map(
        typeComponents
          .filter((c) => c?.typeComponentId)
          .map((c) => [c.typeComponentId, Boolean(c.isUnderWarranty)])
      );

      this.#validateWarrantyConsistency(typeComponentsMap, caselines);

      const processedCaselines = this.#assignInitialCaseLineStatuses(
        typeComponentsMap,
        caselines
      );

      for (const caseline of processedCaselines) {
        if (
          caseline.warrantyStatus === "REJECTED_BY_TECH" &&
          !caseline.rejectionReason
        ) {
          throw new ConflictError(
            `Technician must provide a rejection reason if caseline with typeComponentId ${caseline.typeComponentId} is marked as REJECTED_BY_TECH`
          );
        }
      }

      const dataCaselines = processedCaselines.map((caseline) => ({
        ...caseline,
        guaranteeCaseId: guaranteeCaseId,
        diagnosticTechId: techId,
      }));

      const newCaseLines = await this.#caselineRepository.bulkCreate(
        dataCaselines,
        transaction
      );

      if (!newCaseLines) {
        throw new ConflictError("Failed to create case lines");
      }

      return newCaseLines;
    });

    return rawResult;
  };

  createCaseLine = async ({
    guaranteeCaseId,
    typeComponentId,
    quantity,
    diagnosisText,
    correctionText,
    warrantyStatus,
    serviceCenterId,
    techId,
    companyId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const guaranteeCase = await this.#guaranteeCaseRepository.findDetailById(
        { guaranteeCaseId: guaranteeCaseId },
        transaction
      );

      if (!guaranteeCase) {
        throw new NotFoundError("Guarantee case not found");
      }

      if (guaranteeCase.vehicleProcessingRecord.status !== "IN_DIAGNOSIS") {
        throw new BadRequestError("Record is WAITING_CUSTOMER_APPROVAL");
      }

      if (guaranteeCase.status !== "IN_DIAGNOSIS") {
        throw new BadRequestError(
          "Guarantee case is not in IN_DIAGNOSIS status"
        );
      }

      const typeComponents =
        await this.#warehouseService.searchCompatibleComponentsInStock({
          serviceCenterId: serviceCenterId,
          modelId:
            guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId,
          vin: guaranteeCase?.vehicleProcessingRecord?.vehicle?.vin,
          odometer: guaranteeCase?.vehicleProcessingRecord?.odometer,
          companyId: companyId,
        });

      const typeComponentsMap = new Map(
        typeComponents
          .filter((c) => c?.typeComponentId)
          .map((c) => [c.typeComponentId, Boolean(c.isUnderWarranty)])
      );

      if (typeComponentId && typeComponentsMap.has(typeComponentId)) {
        const isUnderWarrantyByTech =
          warrantyStatus === "ELIGIBLE" ? true : false;

        const isUnderWarrantyBySystem = typeComponentsMap.get(typeComponentId);

        if (!isUnderWarrantyBySystem && isUnderWarrantyByTech) {
          throw new ConflictError(
            "Component is marked as under warranty by technician but is out of warranty in system"
          );
        }
      }

      const initialStatus = "DRAFT";

      const newCaseLine = await this.#caselineRepository.createCaseLine(
        {
          guaranteeCaseId: guaranteeCaseId,
          typeComponentId,
          quantity,
          diagnosisText,
          correctionText,
          status: initialStatus,
          warrantyStatus,
          diagnosticTechId: techId,
        },
        transaction
      );

      if (!newCaseLine) {
        throw new ConflictError("Failed to create case line");
      }

      return newCaseLine;
    });

    return rawResult;
  };

  getCaseLineById = async (
    userId,
    roleName,
    caselineId,
    transaction = null,
    lock = null
  ) => {
    const caseLine = await this.#caselineRepository.findDetailById(
      caselineId,
      transaction,
      lock
    );

    if (!caseLine) {
      throw new NotFoundError("Case line not found");
    }

    const isDiagnosticTech = caseLine.diagnosticTechnician.userId === userId;

    const repairTech = caseLine.repairTechnician?.repairTechId === userId;

    if (roleName === "service_center_technician") {
      if (!isDiagnosticTech && !repairTech) {
        throw new ForbiddenError(
          "User does not have permission to access this case line"
        );
      }
    }
    return caseLine;
  };

  getCaseLines = async ({
    page = 1,
    limit = 10,
    status,
    guaranteeCaseId,
    warrantyStatus,
    vehicleProcessingRecordId,
    diagnosticTechId,
    repairTechId,
    sortBy = "createdAt",
    sortOrder = "DESC",
    serviceCenterId,
  }) => {
    const result = await this.#caselineRepository.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      guaranteeCaseId,
      warrantyStatus,
      vehicleProcessingRecordId,
      diagnosticTechId,
      repairTechId,
      sortBy,
      sortOrder,
      serviceCenterId,
    });

    return {
      caseLines: result.caseLines,
      pagination: result.pagination,
    };
  };

  allocateStockForCaseline = async ({ caseId, caselineId, userId }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const { caseline } = await this.#validateCaseLine(
        caselineId,
        transaction
      );

      const guaranteeCase = await this.#guaranteeCaseRepository.findDetailById(
        { guaranteeCaseId: caseId },
        transaction
      );

      const stocks =
        await this.#warehouseRepository.findStocksByTypeComponentOrderByWarehousePriority(
          {
            typeComponentIds: [caseline.typeComponentId],
            context: "SERVICE_CENTER",
            entityId:
              guaranteeCase.vehicleProcessingRecord?.createdByStaff
                ?.serviceCenterId,
            vehicleModelId:
              guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      const stocksMap = new Map();
      for (const stock of stocks) {
        stocksMap.set(stock.stockId, stock);
      }

      await this.#validateStockAvailability(stocks, caseline);

      const reservations = this.#allocateStock({
        stocks,
        quantity: caseline.quantity,
      });

      const componentIds = await this.#collectComponentsFromReservations({
        reservations,
        caseline,
        stocksMap,
        transaction,
      });

      const componentReservationsToCreate = componentIds.map((componentId) => ({
        caseLineId: caselineId,
        componentId: componentId,
      }));

      const [
        componentReservations,
        stockUpdates,
        componentStatusUpdates,
        caselineStatusUpdate,
      ] = await Promise.all([
        this.#componentReservationRepository.bulkCreate(
          { componentReservations: componentReservationsToCreate },
          transaction
        ),

        this.#warehouseRepository.bulkUpdateStockQuantities(
          reservations,
          transaction
        ),

        this.#componentRepository.bulkUpdateStatus(
          {
            componentIds: componentIds,
            status: "RESERVED",
          },
          transaction
        ),

        this.#caselineRepository.bulkUpdateStatusByIds(
          {
            caseLineIds: [caselineId],
            status: "READY_FOR_REPAIR",
          },
          transaction
        ),
      ]);

      return {
        componentReservations,
        stockUpdates,
        componentStatusUpdates,
        caselineStatusUpdate,
      };
    });

    const {
      componentReservations,
      stockUpdates,
      componentStatusUpdates,
      caselineStatusUpdate,
    } = rawResult;

    const formattedCaselineStatus = caselineStatusUpdate.map((cl) => ({
      caselineId: cl.id,
      status: cl.status,
      updatedAt: formatUTCtzHCM(cl.updatedAt),
    }));

    return {
      componentReservations,
      stockUpdates,
      componentStatusUpdates,
      formattedCaselineStatus,
    };
  };

  approveCaseline = async ({
    approvedCaseLineIds,
    rejectedCaseLineIds,
    serviceCenterId,
  }) => {
    const arrayApproveIds = approvedCaseLineIds?.map((id) => id?.id);
    const arrayRejectId = rejectedCaseLineIds?.map((id) => id?.id);

    const arrayIds = [...arrayApproveIds, ...arrayRejectId];

    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const caselines = await this.#caselineRepository.findByIds(
        { caseLineIds: arrayIds },
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!caselines || caselines.length === 0) {
        throw new NotFoundError("Caselines not found");
      }

      for (const caseline of caselines) {
        if (caseline.status !== "PENDING_APPROVAL") {
          throw new ConflictError(
            `Caseline with ID ${caseline.id} is not in PENDING_APPROVAL status`
          );
        }

        if (caseline.warrantyStatus === "INELIGIBLE") {
          throw new ConflictError(
            `Caseline with ID ${caseline.id} has INELIGIBLE warranty status and cannot be approved by customer`
          );
        }
      }

      const [updatedApprovedCaseLines, updatedRejectedCaseLines] =
        await Promise.all([
          arrayApproveIds.length > 0
            ? this.#caselineRepository.bulkUpdateStatusByIds(
                {
                  caseLineIds: arrayApproveIds,
                  status: "CUSTOMER_APPROVED",
                },
                transaction
              )
            : null,

          arrayRejectId.length > 0
            ? this.#caselineRepository.bulkUpdateStatusByIds(
                {
                  caseLineIds: arrayRejectId,
                  status: "REJECTED_BY_CUSTOMER",
                },
                transaction
              )
            : null,
        ]);

      const firstCaseline = await this.#caselineRepository.findDetailById(
        arrayIds[0],
        transaction
      );

      if (
        firstCaseline?.guaranteeCase?.vehicleProcessingRecord
          .vehicleProcessingRecordId
      ) {
        const vehicleProcessingRecordId =
          firstCaseline.guaranteeCase.vehicleProcessingRecord
            .vehicleProcessingRecordId;

        const pendingCount =
          await this.#vehicleProcessingRecordRepository.countPendingApprovalByVehicleProcessingRecordId(
            vehicleProcessingRecordId,
            transaction
          );

        if (pendingCount === 0) {
          await this.#vehicleProcessingRecordRepository.updateStatus(
            {
              vehicleProcessingRecordId: vehicleProcessingRecordId,
              status: "PROCESSING",
            },
            transaction
          );

          const roomName = `service_center_manager_${serviceCenterId}`;
          const eventName = "vehicleProcessingRecordStatusUpdated";
          const data = {
            vehicleProcessingRecordId,
            status: "PROCESSING",
          };

          await this.#notificationService.sendToRoom(roomName, eventName, data);
        }
      }

      return { updatedApprovedCaseLines, updatedRejectedCaseLines };
    });

    const { updatedApprovedCaseLines, updatedRejectedCaseLines } = rawResult;

    const formattedApprovedCaselines = updatedApprovedCaseLines
      ? this.#formatConfirmedCaseline(updatedApprovedCaseLines)
      : [];

    const formattedRejectedCaselines = updatedRejectedCaseLines
      ? this.#formatConfirmedCaseline(updatedRejectedCaseLines)
      : [];

    return {
      formattedApprovedCaselines,
      formattedRejectedCaselines,
    };
  };

  updateCaseLine = async ({
    guaranteeCaseId,
    caselineId,
    diagnosisText,
    correctionText,
    typeComponentId,
    quantity,
    warrantyStatus,
    rejectionReason,
    serviceCenterId,
    companyId,
    userId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const caseline = await this.#caselineRepository.findById(
        caselineId,
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!caseline) {
        throw new NotFoundError("Caseline not found");
      }

      if (caseline.status === "DRAFT") {
        const guaranteeCase =
          await this.#guaranteeCaseRepository.findDetailById(
            { guaranteeCaseId: guaranteeCaseId },
            transaction
          );

        if (!guaranteeCase) {
          throw new NotFoundError("Guarantee case not found");
        }

        const typeComponents =
          await this.#warehouseService.searchCompatibleComponentsInStock({
            serviceCenterId: serviceCenterId,
            modelId:
              guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId,
            vin: guaranteeCase?.vehicleProcessingRecord?.vehicle?.vin,
            odometer: guaranteeCase?.vehicleProcessingRecord?.odometer,
            companyId: companyId,
          });

        const typeComponentsMap = new Map(
          typeComponents
            .filter((c) => c?.typeComponentId)
            .map((c) => [c.typeComponentId, Boolean(c.isUnderWarranty)])
        );

        if (typeComponentId) {
          if (typeComponentsMap.has(typeComponentId)) {
            const isUnderWarrantyByTech =
              warrantyStatus === "ELIGIBLE" ? true : false;

            const isUnderWarrantyBySystem =
              typeComponentsMap.get(typeComponentId);

            if (!isUnderWarrantyBySystem && isUnderWarrantyByTech) {
              throw new ConflictError(
                "Component is marked as under warranty by technician but is out of warranty in system"
              );
            }
          }
        }

        if (warrantyStatus === "INELIGIBLE" && !rejectionReason) {
          throw new ConflictError(
            `Technician must provide a rejection reason if caseline with typeComponentId ${caseline.typeComponentId} is marked as REJECTED_BY_TECH`
          );
        }

        const initialStatus = "DRAFT";

        var updatedCaseline = await this.#caselineRepository.updateCaseline(
          {
            caselineId,
            diagnosisText,
            correctionText,
            typeComponentId,
            quantity,
            status: initialStatus,
            warrantyStatus,
            rejectionReason,
          },
          transaction
        );

        if (!updatedCaseline) {
          throw new ConflictError("Failed to update caseline");
        }
      } else {
        throw new ConflictError(
          "Caseline can only be updated when it is in DRAFT status"
        );
      }

      if (caseline.diagnosticTechId !== userId) {
        throw new ForbiddenError("You are not allowed to update this caseline");
      }

      return updatedCaseline;
    });

    return rawResult;
  };

  assignTechnicianToRepairCaseline = async ({
    caselineId,
    technicianId,
    serviceCenterId,
  }) => {
    return await db.sequelize.transaction(async (transaction) => {
      const caseline = await this.#caselineRepository.findById(
        caselineId,
        transaction,
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
          caselineId,
          transaction
        );

      if (existingAssignment) {
        throw new ConflictError(
          `Technician already assigned to this caseline. Current assignee: ${existingAssignment.technicianId}`
        );
      }

      const technician = await this.#userRepository.findUserById(
        { userId: technicianId },
        transaction
      );

      if (!technician) {
        throw new NotFoundError("Technician not found");
      }

      if (technician.serviceCenterId !== serviceCenterId) {
        throw new ConflictError(
          "Technician does not belong to this service center"
        );
      }

      if (technician.role.roleName !== "service_center_technician") {
        throw new ConflictError(
          "User is not a technician. Role must be service_center_technician"
        );
      }

      const [taskAssignment, updatedCaseline] = await Promise.all([
        this.#taskAssignmentRepository.createTaskAssignmentForCaseline(
          {
            caseLineId: caselineId,
            technicianId,
            taskType: "REPAIR",
          },
          transaction
        ),

        this.#caselineRepository.assignTechnicianToRepairCaseline({
          caselineId,
          technicianId,
          transaction,
        }),
      ]);

      if (!taskAssignment) {
        throw new ConflictError("Failed to create task assignment");
      }

      if (!updatedCaseline) {
        throw new ConflictError(
          "Failed to update caseline with technician assignment"
        );
      }

      const roomName = `service_center_technician_${technicianId}`;
      const eventName = "newCaselineAssignment";
      const data = {
        taskAssignment,
        caseline: updatedCaseline,
      };

      await this.#notificationService.sendToRoom(roomName, eventName, data);

      return {
        caseline: {
          caselineId: updatedCaseline.id,
          repairTechId: updatedCaseline.repairTechId,
          status: updatedCaseline.status,
          updatedAt: formatUTCtzHCM(updatedCaseline.updatedAt),
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

  markRepairCompleted = async (
    caselineId,
    userId,
    roleName,
    serviceCenterId
  ) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const caseline = await this.#caselineRepository.findById(
        caselineId,
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!caseline) {
        throw new NotFoundError("Caseline not found");
      }

      if (caseline.status !== "IN_REPAIR") {
        throw new ConflictError(
          `Caseline must be IN_REPAIR to be marked as completed. Current status: ${caseline.status}`
        );
      }

      if (caseline.repairTechId !== userId) {
        throw new ForbiddenError(
          "Only the assigned repair technician can mark this repair as complete"
        );
      }

      const guaranteeCase = caseline.guaranteeCase;
      const recordServiceCenterId =
        guaranteeCase?.vehicleProcessingRecord?.createdByStaff?.serviceCenterId;

      if (!recordServiceCenterId) {
        throw new ConflictError(
          "Cannot determine service center for this caseline"
        );
      }

      if (recordServiceCenterId !== serviceCenterId) {
        throw new ForbiddenError(
          "This caseline does not belong to your service center"
        );
      }

      const reservations =
        await this.#componentReservationRepository.findByCaselineId(
          caselineId,
          transaction,
          Transaction.LOCK.SHARE
        );

      if (reservations && reservations.length > 0) {
        for (const reservation of reservations) {
          const component = await this.#componentRepository.findById(
            reservation.componentId,
            transaction,
            Transaction.LOCK.SHARE
          );

          if (!component) {
            throw new NotFoundError(
              `Component ${reservation.componentId} not found`
            );
          }

          if (
            component.status !== "INSTALLED" ||
            !component.vehicleVin ||
            !component.installedAt
          ) {
            throw new ConflictError(
              `Component ${component.serialNumber} must be in INSTALLED status with valid vehicle VIN and installed date`
            );
          }

          const hasOldComponent = !!reservation.oldComponentSerial;

          const isReservationComplete = hasOldComponent
            ? reservation.status === "RETURNED" &&
              reservation.oldComponentReturned &&
              reservation.returnedAt
            : reservation.status === "INSTALLED";

          if (!isReservationComplete) {
            const reason = hasOldComponent
              ? `Old component ${reservation.oldComponentSerial} must be returned before marking repair as completed`
              : `Component ${component.serialNumber} must be installed before marking repair as completed`;
            throw new ConflictError(reason);
          }
        }
      }

      const updatedCaseline =
        await this.#caselineRepository.bulkUpdateStatusByIds(
          {
            caseLineIds: [caselineId],
            status: "COMPLETED",
          },
          transaction
        );

      if (!updatedCaseline) {
        throw new ConflictError(
          "Failed to update caseline status to COMPLETED"
        );
      }

      const updatedTaskAssignment =
        await this.#taskAssignmentRepository.completeTaskByCaselineId(
          {
            caseLineId: caselineId,
            completedAt: formatUTCtzHCM(dayjs()),
            isActive: false,
          },
          transaction
        );

      if (!updatedTaskAssignment) {
        throw new ConflictError("Failed to complete task assignment");
      }

      const record =
        await this.#vehicleProcessingRecordRepository.findDetailById(
          {
            id: guaranteeCase.vehicleProcessingRecord.vehicleProcessingRecordId,
            roleName,
            userId,
            serviceCenterId,
          },
          transaction
        );

      const allGuaranteeCases = record?.guaranteeCases || [];
      const allCaseLinesCompleted = allGuaranteeCases.every((gc) =>
        gc.caseLines?.every((cl) => cl.status === "COMPLETED")
      );

      if (allCaseLinesCompleted) {
        const updatedRecord =
          await this.#vehicleProcessingRecordRepository.updateStatus(
            {
              vehicleProcessingRecordId:
                guaranteeCase.vehicleProcessingRecord.vehicleProcessingRecordId,
              status: "READY_FOR_PICKUP",
            },
            transaction
          );

        const roomName = `service_center_staff_${serviceCenterId}`;
        const eventName = "vehicleProcessingRecordStatusUpdated";
        const data = {
          roomName,
          updatedRecord,
        };

        await this.#notificationService.sendToRoom(roomName, eventName, data);
      }

      return { updatedCaseline, updatedTaskAssignment };
    });

    return rawResult;
  };

  #formatConfirmedCaseline = (caselines) => {
    return caselines.map((cl) => ({
      caselineId: cl.id,
      status: cl.status,
      updatedAt: formatUTCtzHCM(cl.updatedAt),
    }));
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
          quantityReserved: quantityCantake,
        });

        quantityNeed -= quantityCantake;
      }

      if (quantityNeed <= 0) {
        return reservations;
      }
    }

    if (reservations.length === 0) {
      throw new ConflictError("No stock available for allocation");
    }

    return reservations;
  };

  #validateGuaranteeCaseForCaseLines = async (
    guaranteeCaseId,
    transaction,
    techId
  ) => {
    const guaranteeCase = await this.#guaranteeCaseRepository.findDetailById(
      { guaranteeCaseId: guaranteeCaseId },
      transaction
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

    return guaranteeCase;
  };

  #validateWarrantyConsistency = (typeComponentsMap, caselines) => {
    if (
      !typeComponentsMap ||
      !(typeComponentsMap instanceof Map) ||
      !Array.isArray(caselines)
    ) {
      throw new Error("Invalid arguments for validateWarrantyConsistency");
    }

    for (const caseline of caselines) {
      if (!caseline?.typeComponentId) continue;

      if (typeComponentsMap.has(caseline.typeComponentId)) {
        const isUnderWarrantyByTech =
          caseline.warrantyStatus === "ELIGIBLE" ? true : false;

        const isUnderWarrantyBySystem = typeComponentsMap.get(
          caseline.typeComponentId
        );

        if (!isUnderWarrantyBySystem && isUnderWarrantyByTech) {
          throw new ConflictError(
            "Component is marked as under warranty by technician but is out of warranty in system"
          );
        }
      }
    }
  };

  #assignInitialCaseLineStatuses = (typeComponentsMap, caselines) => {
    const processedCaselines = [];

    for (const caseline of caselines) {
      const newCaseline = { ...caseline };

      const warrantyStatusByTech = newCaseline.warrantyStatus;

      const systemWarrantyStatus = typeComponentsMap.get(
        newCaseline.typeComponentId
      );

      let initialStatus;

      if (systemWarrantyStatus && warrantyStatusByTech === "ELIGIBLE") {
        initialStatus = "DRAFT";
      } else if (
        systemWarrantyStatus &&
        warrantyStatusByTech === "INELIGIBLE"
      ) {
        initialStatus = "REJECTED_BY_TECH";
      } else {
        initialStatus = "REJECTED_BY_OUT_OF_WARRANTY";
      }

      newCaseline.status = initialStatus;
      processedCaselines.push(newCaseline);
    }

    return processedCaselines;
  };

  #validateCaseLine = async (caselineId, transaction) => {
    const caseline = await this.#caselineRepository.findById(
      caselineId,
      transaction,
      Transaction.LOCK.UPDATE
    );

    if (!caseline) {
      throw new NotFoundError("Caseline not found");
    }

    if (caseline.status !== "CUSTOMER_APPROVED") {
      throw new ConflictError(
        "Caseline must be CUSTOMER_APPROVED to allocate stock"
      );
    }

    const guaranteeCase = caseline?.guaranteeCase;

    if (!guaranteeCase) {
      throw new NotFoundError(
        "Associated guarantee case not found for the caseline"
      );
    }

    return { caseline };
  };

  #validateStockAvailability = async (stocks, caseline) => {
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
  };

  #collectComponentsFromReservations = async ({
    reservations,
    caseline,
    stocksMap,
    transaction,
  }) => {
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
            warehouseId: stock.warehouse.warehouseId,
            limit: reservation.quantityReserved,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (components.length < reservation.quantityReserved) {
        throw new ConflictError(
          `Insufficient available components in warehouse ${stock.warehouseId}. ` +
            `Requested: ${reservation.quantity}, Available: ${components.length}`
        );
      }

      allComponents.push(...components);
    }

    if (allComponents.length === 0) {
      throw new ConflictError("No components collected from reservations");
    }

    const componentIds = allComponents.map(
      (component) => component.componentId
    );

    return componentIds;
  };
}

export default CaseLineService;
