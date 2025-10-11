import { Op } from "sequelize";
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
      { mainTechnicianId: technicianId },
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
        "isDiagnosticFeeApproved",
        "vin",
        "checkInDate",
        "odometer",
        "createdByStaffId",
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
          attributes: ["userId", "name"],
        },
      ],
    });

    if (!record) {
      return null;
    }

    return record.toJSON();
  };
}

export default VehicleProcessingRecordRepository;
