import dayjs from "dayjs";
import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";
import { Transaction } from "sequelize";
import db from "../models/index.cjs";

class ComponentReservationService {
  #componentReservationRepository;
  #componentRepository;
  #caselineRepository;
  #warehouseRepository;
  #taskAssignmentRepository;

  constructor({
    componentReservationRepository,
    componentRepository,
    caselineRepository,
    warehouseRepository,
    taskAssignmentRepository,
  }) {
    this.#componentReservationRepository = componentReservationRepository;
    this.#componentRepository = componentRepository;
    this.#caselineRepository = caselineRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#taskAssignmentRepository = taskAssignmentRepository;
  }

  #validateReservationById = async (reservationId, transaction) => {
    const existingConversation =
      await this.#componentReservationRepository.findById(
        reservationId,
        transaction,
        Transaction.LOCK.UPDATE
      );

    if (!existingConversation) {
      throw new Error("Reservation not found");
    }

    if (existingConversation.status !== "RESERVED") {
      throw new Error("Only RESERVED components can be picked up");
    }
  };

  #validateComponentById = async (updatedReservation, transaction) => {
    const componentId = updatedReservation?.componentId;

    const component = await this.#componentRepository.findById(
      componentId,
      transaction,
      Transaction.LOCK.UPDATE
    );

    if (!component) {
      throw new Error("Component not found");
    }

    if (component.status !== "RESERVED") {
      throw new Error("Only RESERVED components can be picked up");
    }

    return componentId;
  };

  #processUpdateStockItem = async (updatedComponent, transaction) => {
    const typeComponentId = updatedComponent?.typeComponentId;
    const warehouseId = updatedComponent?.warehouseId;

    const stockItem = await this.#warehouseRepository.findStockItem(
      { warehouseId, typeComponentId },
      transaction,
      Transaction.LOCK.UPDATE
    );

    if (!stockItem) {
      throw new Error("Stock item not found");
    }

    const newQuantityInStock = stockItem.quantityInStock - 1;
    const newQuantityReserved = stockItem.quantityReserved - 1;

    await this.#warehouseRepository.updateStockItem(
      {
        warehouseId,
        typeComponentId,
        quantityInStock: newQuantityInStock,
        quantityReserved: newQuantityReserved,
      },
      transaction
    );
  };

  pickupReservedComponents = async ({
    reservationIds,
    serviceCenterId,
    pickedUpByTechId,
  }) => {
    const uniqueReservationIds = Array.from(new Set(reservationIds));

    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const updatedReservations = [];
      const caseLineIdsForUpdate = new Set();

      for (const reservationId of uniqueReservationIds) {
        await this.#validateReservationById(reservationId, transaction);

        const updatedReservation =
          await this.#componentReservationRepository.updateReservationStatusPickUp(
            {
              reservationId,
              serviceCenterId,
              pickedUpByTechId,
              pickedUpAt: formatUTCtzHCM(dayjs()),
              status: "PICKED_UP",
            },
            transaction
          );

        if (!updatedReservation) {
          throw new Error("Failed to update reservation status to PICKED_UP");
        }

        const componentId = await this.#validateComponentById(
          updatedReservation,
          transaction
        );

        const componentBeforeUpdate = await this.#componentRepository.findById(
          componentId,
          transaction,
          Transaction.LOCK.UPDATE
        );

        if (!componentBeforeUpdate || !componentBeforeUpdate.warehouseId) {
          throw new Error("Component must have warehouseId before pickup");
        }

        await this.#componentRepository.updateStatusWithTechnician(
          componentId,
          { status: "WITH_TECHNICIAN" },
          transaction
        );

        await this.#processUpdateStockItem(componentBeforeUpdate, transaction);

        if (updatedReservation.caseLineId) {
          caseLineIdsForUpdate.add(updatedReservation.caseLineId);
        }

        updatedReservations.push(updatedReservation);
      }

      if (caseLineIdsForUpdate.size > 0) {
        await this.#caselineRepository.bulkUpdateStatusByIds(
          {
            caseLineIds: Array.from(caseLineIdsForUpdate),
            status: "IN_REPAIR",
          },
          transaction
        );
      }

      return updatedReservations;
    });

    return rawResult;
  };

  installComponent = async ({ reservationId }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingConversation =
        await this.#componentReservationRepository.findById(
          reservationId,
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!existingConversation) {
        throw new Error("Reservation not found");
      }

      if (existingConversation.status !== "PICKED_UP") {
        throw new Error("Only PICKED_UP components can be installed");
      }

      const updatedReservation =
        await this.#componentReservationRepository.updateReservationStatusInstall(
          {
            reservationId,
            installedAt: formatUTCtzHCM(dayjs()),
            status: "INSTALLED",
          },
          transaction
        );

      const caseLineId = updatedReservation.caseLineId;

      const caseline = await this.#caselineRepository.getVinById(
        caseLineId,
        transaction,
        Transaction.LOCK.SHARE
      );

      const vin = caseline?.guaranteeCase?.vehicleProcessingRecord?.vin;

      const componentId = updatedReservation?.componentId;

      const component = await this.#componentRepository.findById(
        componentId,
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!component) {
        throw new Error("Component not found");
      }

      if (component.status !== "WITH_TECHNICIAN") {
        throw new Error("Only WITH_TECHNICIAN components can be installed");
      }

      await this.#componentRepository.updateInstalledComponentStatus(
        {
          vehicleVin: vin,
          componentId: componentId,
          installedAt: formatUTCtzHCM(dayjs()),
          status: "INSTALLED",
          currentHolderId: null,
        },
        transaction
      );

      return updatedReservation;
    });

    return rawResult;
  };

  returnReservedComponent = async ({ reservationId, serialNumber }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingConversation = await this.#validateReturnReservationById(
        reservationId,
        transaction
      );

      const existingComponent = await this.#componentRepository.findById(
        existingConversation.componentId,
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (existingComponent.serialNumber === serialNumber) {
        throw new Error(
          "Returning component must be different from the installed one"
        );
      }

      const existingReturnComponentBySerial =
        await this.#componentRepository.findBySerialNumber(
          serialNumber,
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!existingReturnComponentBySerial) {
        throw new Error("Component to return not found in the system");
      }

      if (existingReturnComponentBySerial.status !== "INSTALLED") {
        throw new Error("Only INSTALLED components can be used for return");
      }

      const typeComponentIdOfComponentReturn =
        existingReturnComponentBySerial.typeComponentId;

      const typeComponentIdOfInstalledComponent =
        existingComponent.typeComponentId;

      if (
        typeComponentIdOfComponentReturn !== typeComponentIdOfInstalledComponent
      ) {
        throw new Error(
          "Component type mismatch between installed and returning component"
        );
      }

      const caseLineId = existingConversation.caseLineId;

      const caseline = await this.#caselineRepository.getVinById(
        caseLineId,
        transaction,
        Transaction.LOCK.SHARE
      );

      const vin = caseline?.guaranteeCase?.vehicleProcessingRecord?.vin;

      const component = await this.#componentRepository.belongToProcessingByVin(
        existingReturnComponentBySerial.serialNumber,
        vin,
        transaction
      );

      if (!component) {
        throw new Error(
          "The return component does not belong to the vehicle under processing"
        );
      }

      const updatedReservation =
        await this.#componentReservationRepository.updateReservationStatusReturn(
          {
            reservationId,
            oldComponentSerial: existingReturnComponentBySerial.serialNumber,
            oldComponentReturned: true,
            returnedAt: formatUTCtzHCM(dayjs()),
            status: "RETURNED",
          },
          transaction
        );

      const updatedComponent =
        await this.#componentRepository.updateStatusComponentReturn(
          existingReturnComponentBySerial.componentId,
          { status: "RETURNED" },
          transaction
        );

      return { updatedReservation, updatedComponent };
    });

    return rawResult;
  };

  getComponentReservations = async ({
    page = 1,
    limit = 10,
    status,
    warehouseId,
    typeComponentId,
    caseLineId,
    guaranteeCaseId,
    vehicleProcessingRecordId,
    repairTechId,
    repairTechPhone,
    serviceCenterId,
    sortBy,
    sortOrder,
  }) => {
    const result = await this.#componentReservationRepository.findAll(
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        warehouseId,
        typeComponentId,
        caseLineId,
        guaranteeCaseId,
        vehicleProcessingRecordId,
        repairTechId,
        repairTechPhone,
        serviceCenterId,
        sortBy,
        sortOrder,
      },
      null
    );

    return result;
  };

  #validateReturnReservationById = async (reservationId, transaction) => {
    const existingReservation =
      await this.#componentReservationRepository.findById(
        reservationId,
        transaction,
        Transaction.LOCK.UPDATE
      );

    if (!existingReservation) {
      throw new Error("Reservation not found");
    }

    const STATUS_CONSERVATION_CAN_RETURN = ["PICKED_UP", "INSTALLED"];

    if (!STATUS_CONSERVATION_CAN_RETURN.includes(existingReservation.status)) {
      throw new Error(
        "Only conservation PICKED_UP or INSTALLED components can be returned"
      );
    }

    return existingReservation;
  };
}

export default ComponentReservationService;
