import { Op } from "sequelize";
import db from "../models/index.cjs";

const { VehicleProcessingRecord, User, VehicleModel, Vehicle, GuaranteeCase } =
  db;

class VehicleProcessingRecordRepository {
  createRecord = async (
    { odometer, createdByStaffId, vin, visitorInfo = null, checkInDate },
    option = null
  ) => {
    const newRecord = await VehicleProcessingRecord.create(
      {
        vin: vin,
        odometer: odometer,
        createdByStaffId: createdByStaffId,
        checkInDate: checkInDate,
        visitorInfo: visitorInfo,
      },
      { transaction: option }
    );

    if (!newRecord) {
      return null;
    }

    return newRecord.toJSON();
  };

  updateMainTechnician = async (
    { vehicleProcessingRecordId, technicianId },
    transaction = null
  ) => {
    const [affectedRows] = await VehicleProcessingRecord.update(
      { mainTechnicianId: technicianId, status: "IN_DIAGNOSIS" },
      {
        where: {
          vehicleProcessingRecordId: vehicleProcessingRecordId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return affectedRows;
    }

    const updatedRecord = await VehicleProcessingRecord.findByPk(
      vehicleProcessingRecordId,
      {
        transaction: transaction,
        attributes: ["vehicleProcessingRecordId", "vin", "status"],
        include: [
          {
            model: User,
            as: "mainTechnician",
            attributes: ["userId", "name"],
          },
        ],
      }
    );

    return updatedRecord;
  };

  findRecordIsNotCompleted = async (
    { vin },
    transaction = null,
    lock = null
  ) => {
    const record = await VehicleProcessingRecord.findOne({
      attributes: ["vehicleProcessingRecordId"],
      where: {
        vin,
        status: {
          [Op.ne]: "completed",
        },
      },
      transaction: transaction,
      lock: lock,
    });

    if (!record) {
      return null;
    }

    return record.toJSON();
  };

  findDetailById = async ({ id }, transaction = null, lock = null) => {
    const record = await VehicleProcessingRecord.findByPk(id, {
      attributes: ["vin", "checkInDate", "odometer", "status", "visitorInfo"],

      include: [
        {
          model: User,
          as: "mainTechnician",
          attributes: ["userId", "name"],
        },

        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vin"],

          include: [
            {
              model: VehicleModel,
              as: "model",
              attributes: [["vehicle_model_name", "name"], "vehicleModelId"],
            },
          ],
        },

        {
          model: GuaranteeCase,
          as: "guaranteeCases",
          attributes: ["guaranteeCaseId", "status", "contentGuarantee"],
        },

        {
          model: User,
          as: "createdByStaff",
          attributes: ["userId", "name", "serviceCenterId"],
        },
      ],

      transaction: transaction,
      lock: lock,
    });

    if (!record) {
      return null;
    }

    return record.toJSON();
  };

  findAll = async ({
    serviceCenterId,
    limit,
    offset,
    status,
    userId,
    roleName,
  }) => {
    let staffCondition = { serviceCenterId: serviceCenterId };
    let technicianCondition = {};
    let whereCondition = {};

    if (status) {
      whereCondition.status = status;
    }

    if (roleName === "service_center_technician") {
      technicianCondition = { userId: userId };
    }

    if (roleName === "service_center_staff") {
      staffCondition.userId = userId;
    } else if (roleName === "service_center_technician") {
      technicianCondition.userId = userId;
    }

    const records = await VehicleProcessingRecord.findAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      subQuery: false,
      order: [["checkInDate", "DESC"]],
      attributes: [
        "vehicleProcessingRecordId",
        "vin",
        "checkInDate",
        "odometer",
        "status",
      ],

      include: [
        {
          model: User,
          as: "mainTechnician",
          attributes: ["userId", "name"],

          where: technicianCondition,

          required: roleName === "service_center_technician",
        },

        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vin"],

          include: [
            {
              model: VehicleModel,
              as: "model",
              attributes: [["vehicle_model_name", "name"], "vehicleModelId"],
            },
          ],
        },

        {
          model: GuaranteeCase,
          as: "guaranteeCases",
          attributes: ["guaranteeCaseId", "status", "contentGuarantee"],
        },

        {
          model: User,
          as: "createdByStaff",
          attributes: ["userId", "name"],

          where: staffCondition,

          required: true,
        },
      ],
    });

    if (!records || records.length === 0) {
      return null;
    }

    return {
      records: records.map((record) => record.toJSON()),
      recordsCount: records.length,
    };
  };
}

export default VehicleProcessingRecordRepository;
