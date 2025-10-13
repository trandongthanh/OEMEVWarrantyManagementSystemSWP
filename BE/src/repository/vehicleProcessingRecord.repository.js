import { Op, where } from "sequelize";
import db from "../models/index.cjs";

const { VehicleProcessingRecord, User, VehicleModel, Vehicle, GuaranteeCase } =
  db;

class VehicleProcessingRecordRepository {
  createRecord = async ({ odometer, createdByStaffId, vin }, option = null) => {
    const newRecord = await VehicleProcessingRecord.create(
      {
        vin: vin,
        checkInDate: new Date(),
        odometer: odometer,
        createdByStaffId: createdByStaffId,
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
    option = null
  ) => {
    const rowEffect = await VehicleProcessingRecord.update(
      { mainTechnicianId: technicianId, status: "IN_DIAGNOSIS" },
      {
        where: {
          vehicleProcessingRecordId: vehicleProcessingRecordId,
        },
        transaction: option,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedRecord = await VehicleProcessingRecord.findOne({
      where: {
        vehicleProcessingRecordId: vehicleProcessingRecordId,
      },

      attributes: [
        "vehicleProcessingRecordId",
        "status",
        "vin",
        "checkInDate",
        "odometer",
        "createdByStaffId",
        "diagnosticFee",
      ],

      include: [
        {
          model: User,
          as: "mainTechnician",
          attributes: ["userId", "name"],
        },
      ],

      transaction: option,
    });

    if (!updatedRecord) {
      return null;
    }

    return updatedRecord.toJSON();
  };

  findRecordIsNotCompleted = async ({ vin }) => {
    const record = await VehicleProcessingRecord.findOne({
      where: {
        vin,
        status: {
          [Op.ne]: "completed",
        },
      },
    });

    if (!record) {
      return null;
    }

    if (Array.isArray(record)) {
      return record.map((item) => item.toJSON());
    }

    return record.toJSON();
  };

  findById = async ({ id }) => {
    const record = await VehicleProcessingRecord.findByPk(id, {
      attributes: ["vin", "checkInDate", "odometer", "status"],

      order: [["checkInDate", "DESC"]],
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

    if (roleName === "service_center_technician") {
      technicianCondition = { userId: userId };
    }

    if (roleName === "service_center_staff") {
      staffCondition.userId = userId;
    } else if (roleName === "service_center_technician") {
      technicianCondition.userId = userId;
    }

    const records = await VehicleProcessingRecord.findAll({
      where: status ? { status: status } : {},
      limit,
      offset,
      subQuery: false,
      order: [["checkInDate", "DESC"]],
      attributes: ["vin", "checkInDate", "odometer", "status"],

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
