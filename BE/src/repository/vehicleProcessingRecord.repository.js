import { Op, where } from "sequelize";
import db from "../models/index.cjs";

const {
  VehicleProcessingRecord,
  User,
  VehicleModel,
  Vehicle,
  GuaranteeCase,
  CaseLine,
  VehicleCompany,
  TypeComponent,
} = db;

class VehicleProcessingRecordRepository {
  findByPk = async (
    vehicleProcessingRecordId,
    transaction = null,
    lock = null
  ) => {
    const record = await VehicleProcessingRecord.findByPk(
      vehicleProcessingRecordId,
      {
        transaction,
        lock,
      }
    );

    return record ? record.toJSON() : null;
  };

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
          [Op.ne]: "COMPLETED",
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

  findDetailById = async (
    { id, roleName, userId, serviceCenterId },
    transaction = null,
    lock = null
  ) => {
    let whereCondition = {};

    if (roleName === "service_center_technician") {
      whereCondition = {
        [Op.or]: [
          { "$guaranteeCases.caseLines.diagnostic_tech_id$": userId },
          { "$guaranteeCases.caseLines.repair_tech_id$": userId },
          { "$guaranteeCases.lead_tech_id$": userId },
          { mainTechnicianId: userId },
        ],
      };
    }

    const record = await VehicleProcessingRecord.findOne({
      where: {
        vehicleProcessingRecordId: id,
        ...whereCondition,
      },
      attributes: [
        "vehicleProcessingRecordId",
        "vin",
        "checkInDate",
        "odometer",
        "status",
        "visitorInfo",
      ],

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

              include: [
                {
                  model: VehicleCompany,
                  as: "company",
                  attributes: ["vehicleCompanyId", "name"],
                  required: true,
                },
              ],
            },
          ],
        },

        {
          model: GuaranteeCase,
          as: "guaranteeCases",
          attributes: ["guaranteeCaseId", "status", "contentGuarantee"],
          required: false,

          include: [
            {
              model: CaseLine,
              as: "caseLines",
              attributes: [
                "id",
                "diagnosisText",
                "correctionText",
                "warrantyStatus",
                "status",
                "rejectionReason",
                "repairTechId",
                "diagnosticTechId",
                "quantity",
              ],

              include: [
                {
                  model: TypeComponent,
                  as: "typeComponent",
                  attributes: ["typeComponentId", "name", "category"],
                  required: false,
                },
              ],
              required: false,
            },
          ],
        },

        {
          model: User,
          as: "createdByStaff",
          attributes: ["userId", "name", "serviceCenterId"],

          where: { serviceCenterId: serviceCenterId },
          required: true,
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
    limit = 20,
    offset = 0,
    status,
    userId,
    roleName,
  }) => {
    let whereCondition = {};
    if (roleName === "service_center_technician") {
      whereCondition = {
        [Op.or]: [
          { "$guaranteeCases.caseLines.diagnostic_tech_id$": userId },
          { "$guaranteeCases.caseLines.repair_tech_id$": userId },
          { "$guaranteeCases.lead_tech_id$": userId },
          { mainTechnicianId: userId },
        ],
      };
    }

    const { rows, count } = await VehicleProcessingRecord.findAndCountAll({
      where: {
        ...(status ? { status } : {}),
        ...whereCondition,
      },

      attributes: [
        "vehicleProcessingRecordId",
        "vin",
        "checkInDate",
        "odometer",
        "status",
        "visitorInfo",
      ],
      include: [
        {
          model: User,
          as: "mainTechnician",
          attributes: ["userId", "name"],
          required: false,
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vin"],
          required: false,
          include: [
            {
              model: VehicleModel,
              as: "model",
              attributes: [["vehicle_model_name", "name"], "vehicleModelId"],
              required: false,
            },
          ],
        },
        {
          model: GuaranteeCase,
          as: "guaranteeCases",
          attributes: [
            "guaranteeCaseId",
            "status",
            "contentGuarantee",
            "leadTechId",
          ],
          required: false,
          include: [
            {
              model: CaseLine,
              as: "caseLines",
              attributes: [
                "id",
                "typeComponentId",
                "diagnosisText",
                "correctionText",
                "warrantyStatus",
                "status",
                "rejectionReason",
                "repairTechId",
                "diagnosticTechId",
                "quantity",
              ],

              include: [
                {
                  model: TypeComponent,
                  as: "typeComponent",
                  attributes: ["typeComponentId", "name", "category"],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "createdByStaff",
          attributes: ["userId", "name", "serviceCenterId"],
          where: { serviceCenterId },
          required: true,
        },
      ],

      order: [["checkInDate", "DESC"]],
      limit,
      offset,
      subQuery: false,
      distinct: true,
    });

    if (!rows.length) {
      return { records: [], recordsCount: 0, total: 0 };
    }

    return {
      records: rows.map((r) => r.toJSON()),
      recordsCount: rows.length,
      total: count,
    };
  };

  updateStatus = async (
    { vehicleProcessingRecordId, status },
    transaction = null
  ) => {
    const [rowEffect] = await VehicleProcessingRecord.update(
      { status },
      {
        where: { vehicleProcessingRecordId },
        transaction,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedRecord = await VehicleProcessingRecord.findByPk(
      vehicleProcessingRecordId,
      {
        transaction,
      }
    );

    return updatedRecord ? updatedRecord.toJSON() : null;
  };

  countPendingApprovalByVehicleProcessingRecordId = async (
    vehicleProcessingRecordId,
    transaction = null
  ) => {
    const count = await CaseLine.count({
      where: {
        status: "PENDING_APPROVAL",
      },
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          attributes: [],
          where: {
            vehicleProcessingRecordId: vehicleProcessingRecordId,
          },
          required: true,
        },
      ],
      transaction: transaction,
    });

    return count;
  };

  completeRecord = async (
    { vehicleProcessingRecordId, status, checkOutDate },
    transaction = null
  ) => {
    const [rowEffect] = await VehicleProcessingRecord.update(
      { status, checkOutDate: checkOutDate },
      {
        where: { vehicleProcessingRecordId },
        transaction,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedRecord = await VehicleProcessingRecord.findByPk(
      vehicleProcessingRecordId,
      {
        transaction,
      }
    );

    return updatedRecord ? updatedRecord.toJSON() : null;
  };

  getServiceHistoryByVin = async (
    { vin, statusFilter, limit, offset },
    transaction = null
  ) => {
    const records = await VehicleProcessingRecord.findAll({
      where: {
        vin,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      attributes: [
        "vehicleProcessingRecordId",
        "vin",
        "checkInDate",
        "checkOutDate",
        "odometer",
        "status",
        "visitorInfo",
      ],
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCases",
          attributes: ["guaranteeCaseId", "status", "contentGuarantee"],
          required: false,

          include: [
            {
              model: CaseLine,
              as: "caseLines",
              attributes: [
                "id",
                "diagnosisText",
                "correctionText",
                "warrantyStatus",
                "status",
                "rejectionReason",
                "repairTechId",
                "diagnosticTechId",
                "quantity",
                "name",
              ],

              include: [
                {
                  model: TypeComponent,
                  as: "typeComponent",
                  attributes: ["typeComponentId", "name", "category"],
                  required: false,
                },
              ],
              required: false,
            },
          ],
        },
      ],

      order: [["checkInDate", "DESC"]],
      limit,
      offset,
      transaction,
    });

    if (!records.length) {
      return [];
    }

    return records.map((r) => r.toJSON());
  };
}

export default VehicleProcessingRecordRepository;
