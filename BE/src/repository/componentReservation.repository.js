import db from "../models/index.cjs";

const {
  ComponentReservation,
  Component,
  CaseLine,
  GuaranteeCase,
  VehicleProcessingRecord,
  User,
} = db;

class ComponentReservationRepository {
  bulkCreate = async ({ componentReservations }, transaction = null) => {
    const newComponentReservations = await ComponentReservation.bulkCreate(
      componentReservations,
      {
        transaction: transaction,
      }
    );

    return newComponentReservations.map((cr) => cr.toJSON());
  };

  updateReservationStatusPickUp = async (
    { reservationId, pickedUpByTechId, pickedUpAt, status = "PICKED_UP" },

    transaction = null
  ) => {
    const [affectedRows] = await ComponentReservation.update(
      {
        status: status,
        pickedUpBy: pickedUpByTechId,
        pickedUpAt: pickedUpAt,
      },
      {
        where: {
          reservationId: reservationId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedReservation = await ComponentReservation.findByPk(
      reservationId,
      {
        transaction: transaction,
      }
    );

    return updatedReservation ? updatedReservation.toJSON() : null;
  };

  findById = async (reservationId, transaction = null, lock = null) => {
    const reservation = await ComponentReservation.findOne({
      where: { reservationId: reservationId },
      transaction: transaction,
      lock: lock,
    });

    return reservation ? reservation.toJSON() : null;
  };

  updateReservationStatusInstall = async (
    { reservationId, installedAt, status = "INSTALLED" },
    transaction = null
  ) => {
    const [affectedRows] = await ComponentReservation.update(
      {
        status: status,
        installedAt: installedAt,
      },
      {
        where: {
          reservationId: reservationId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedReservation = await ComponentReservation.findByPk(
      reservationId,
      {
        transaction: transaction,
      }
    );

    return updatedReservation ? updatedReservation.toJSON() : null;
  };

  updateReservationStatusReturn = async (
    {
      reservationId,
      oldComponentSerial,
      oldComponentReturned,
      returnedAt,
      status = "RETURNED",
    },
    transaction = null
  ) => {
    const [affectedRows] = await ComponentReservation.update(
      {
        status: status,
        returnedAt: returnedAt,
        oldComponentSerial: oldComponentSerial,
        oldComponentReturned: oldComponentReturned,
      },
      {
        where: {
          reservationId: reservationId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedReservation = await ComponentReservation.findByPk(
      reservationId,
      {
        transaction: transaction,
      }
    );

    return updatedReservation ? updatedReservation.toJSON() : null;
  };

  findByCaselineId = async (caseLineId, transaction = null, lock = null) => {
    const reservations = await ComponentReservation.findAll({
      where: { caseLineId },
      transaction: transaction,
      lock: lock,
    });

    return reservations.map((reservation) => reservation.toJSON());
  };

  findAll = async (
    {
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
      sortBy = "createdAt",
      sortOrder = "DESC",
    },
    transaction = null
  ) => {
    const offset = (page - 1) * limit;
    const reservationWhere = {};
    const componentWhere = {};
    const guaranteeCaseWhere = {};
    const vehicleProcessingRecordWhere = {};
    const createdByStaffWhere = {};
    const repairTechnicianWhere = {};

    if (status) {
      reservationWhere.status = status;
    }

    if (caseLineId) {
      reservationWhere.caseLineId = caseLineId;
    }

    if (warehouseId) {
      componentWhere.warehouseId = warehouseId;
    }

    if (typeComponentId) {
      componentWhere.typeComponentId = typeComponentId;
    }

    if (guaranteeCaseId) {
      guaranteeCaseWhere.guaranteeCaseId = guaranteeCaseId;
    }

    if (vehicleProcessingRecordId) {
      vehicleProcessingRecordWhere.vehicleProcessingRecordId =
        vehicleProcessingRecordId;
    }

    if (serviceCenterId) {
      createdByStaffWhere.serviceCenterId = serviceCenterId;
    }

    if (repairTechId) {
      repairTechnicianWhere.userId = repairTechId;
    }

    if (repairTechPhone) {
      repairTechnicianWhere.phone = repairTechPhone;
    }

    const { count, rows } = await ComponentReservation.findAndCountAll({
      where: reservationWhere,
      include: [
        {
          model: Component,
          as: "component",
          attributes: [
            "componentId",
            "serialNumber",
            "status",
            "warehouseId",
            "typeComponentId",
          ],
          where:
            Object.keys(componentWhere).length > 0 ? componentWhere : undefined,
          required: true,
        },
        {
          model: User,
          as: "pickedUpByTech",
          attributes: ["userId", "name", "email", "phone", "roleId"],
          required: false,
        },
        {
          model: CaseLine,
          as: "caseLine",
          attributes: [
            "id",
            "guaranteeCaseId",
            "typeComponentId",
            "quantity",
            "status",
            "diagnosticTechId",
            "repairTechId",
          ],
          include: [
            {
              model: User,
              as: "diagnosticTechnician",
              attributes: ["userId", "name", "email", "phone"],
              required: false,
            },
            {
              model: User,
              as: "repairTechnician",
              attributes: ["userId", "name", "email", "phone"],
              where:
                Object.keys(repairTechnicianWhere).length > 0
                  ? repairTechnicianWhere
                  : undefined,
              required: Object.keys(repairTechnicianWhere).length > 0,
            },
            {
              model: GuaranteeCase,
              as: "guaranteeCase",
              attributes: [
                "guaranteeCaseId",
                "vehicleProcessingRecordId",
                "status",
              ],
              where:
                Object.keys(guaranteeCaseWhere).length > 0
                  ? guaranteeCaseWhere
                  : undefined,
              required: true,
              include: [
                {
                  model: VehicleProcessingRecord,
                  as: "vehicleProcessingRecord",
                  attributes: [
                    "vehicleProcessingRecordId",
                    "vin",
                    "createdByStaffId",
                  ],
                  where:
                    Object.keys(vehicleProcessingRecordWhere).length > 0
                      ? vehicleProcessingRecordWhere
                      : undefined,
                  required: true,
                  include: [
                    {
                      model: User,
                      as: "createdByStaff",
                      attributes: ["userId", "serviceCenterId", "name"],
                      where:
                        Object.keys(createdByStaffWhere).length > 0
                          ? createdByStaffWhere
                          : undefined,
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      transaction,
      distinct: true,
    });

    return {
      reservations: rows.map((row) => row.toJSON()),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  };
}

export default ComponentReservationRepository;
