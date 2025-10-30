import { Op } from "sequelize";
import db from "../models/index.cjs";

const {
  CaseLine,
  GuaranteeCase,
  User,
  TypeComponent,
  ComponentReservation,
  Component,
  VehicleProcessingRecord,
} = db;

class CaseLineRepository {
  bulkCreate = async (caseLines, transaction = null) => {
    const newCaseLines = await CaseLine.bulkCreate(caseLines, {
      transaction: transaction,
    });

    if (!newCaseLines) {
      return [];
    }

    return newCaseLines.map((caseLine) => caseLine.toJSON());
  };

  createCaseLine = async (caseLineData, transaction = null) => {
    const newCaseLine = await CaseLine.create(caseLineData, {
      transaction: transaction,
    });

    return newCaseLine ? newCaseLine.toJSON() : null;
  };

  findById = async (caseLineId, transaction = null, lock = null) => {
    const caseLine = await CaseLine.findOne({
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
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
              required: true,
              include: [
                {
                  model: User,
                  as: "createdByStaff",
                  attributes: ["userId", "serviceCenterId"],
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      where: { id: caseLineId },
      transaction: transaction,
      lock: lock,
    });

    return caseLine ? caseLine.toJSON() : null;
  };

  bulkUpdateStatusByIds = async (
    { caseLineIds, status },
    transaction = null,
    lock = null
  ) => {
    const [numberOfAffectedRows] = await CaseLine.update(
      { status: status },
      {
        where: {
          id: {
            [Op.in]: caseLineIds,
          },
        },
        transaction: transaction,
        lock: lock,
      }
    );

    if (numberOfAffectedRows <= 0) {
      return [];
    }

    const updatedCaseLines = await this.findByIds({ caseLineIds }, transaction);

    return updatedCaseLines;
  };

  findDetailById = async (caselineId, transaction = null, lock = null) => {
    const caseLine = await CaseLine.findOne({
      attributes: ["id", "warrantyStatus", "status", "updatedAt"],
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          attributes: ["guaranteeCaseId", "contentGuarantee", "status"],
          required: true,

          include: [
            {
              model: VehicleProcessingRecord,
              as: "vehicleProcessingRecord",
              attributes: ["vehicleProcessingRecordId", "vin"],
              required: true,
            },
          ],
        },
        {
          model: User,
          as: "diagnosticTechnician",
          attributes: ["userId", "name"],
        },
        {
          model: User,
          as: "repairTechnician",
          attributes: ["userId", "name"],
        },
        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["typeComponentId", "sku", "name", "price"],
        },
        {
          model: ComponentReservation,
          as: "reservations",
          attributes: ["reservationId", "caseLineId", "status"],

          include: [
            {
              model: Component,
              as: "component",
              attributes: ["componentId", "serialNumber", "status"],
            },
          ],
        },
      ],
      where: { id: caselineId },
      transaction: transaction,
      lock: lock,
    });

    return caseLine ? caseLine.toJSON() : null;
  };

  findByIds = async ({ caseLineIds }, transaction = null, lock = null) => {
    const caseLines = await CaseLine.findAll({
      attributes: ["id", "warrantyStatus", "status", "updatedAt"],
      where: {
        id: {
          [Op.in]: caseLineIds,
        },
      },
      transaction: transaction,
      lock: lock,
    });

    if (!caseLines || caseLines.length === 0) {
      return [];
    }

    return caseLines?.map((cl) => cl.toJSON());
  };

  assignTechnicianToRepairCaseline = async ({
    caselineId,
    technicianId,
    transaction = null,
  }) => {
    const [rowsUpdated] = await CaseLine.update(
      {
        repairTechId: technicianId,
      },
      {
        where: {
          id: caselineId,
        },
        transaction: transaction,
      }
    );

    if (rowsUpdated === 0) {
      return 0;
    }

    const updatedCaseLine = await CaseLine.findByPk(caselineId, {
      transaction: transaction,
    });

    return updatedCaseLine ? updatedCaseLine.toJSON() : null;
  };

  updateCaseline = async (
    {
      caselineId,
      diagnosisText,
      correctionText,
      typeComponentId,
      quantity,
      status,
      warrantyStatus,
      rejectionReason,
    },
    transaction = null
  ) => {
    const [rowsUpdated] = await CaseLine.update(
      {
        diagnosisText,
        correctionText,
        typeComponentId,
        quantity,
        status,
        warrantyStatus,
        rejectionReason,
      },
      {
        where: { id: caselineId },
        transaction: transaction,
      }
    );

    if (rowsUpdated <= 0) {
      return null;
    }

    const updatedCaseLine = await CaseLine.findByPk(caselineId, {
      transaction: transaction,
    });

    return updatedCaseLine ? updatedCaseLine.toJSON() : null;
  };

  getVinById = async (caselineId, transaction = null, lock = null) => {
    const record = await CaseLine.findOne({
      attributes: ["id"],
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          attributes: ["guaranteeCaseId"],
          required: true,
          include: [
            {
              model: VehicleProcessingRecord,
              as: "vehicleProcessingRecord",
              attributes: ["vin"],
              required: true,
            },
          ],
        },
      ],
      where: {
        id: caselineId,
      },
      transaction: transaction,
      lock: lock,
    });

    return record ? record.toJSON() : null;
  };

  findAll = async ({
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
    const offset = (page - 1) * limit;
    const where = {};
    const guaranteeCaseWhere = {};
    const vehicleProcessingRecordWhere = {};
    const serviceCenterWhere = {};

    if (status) where.status = status;
    if (warrantyStatus) where.warrantyStatus = warrantyStatus;
    if (guaranteeCaseId) where.guaranteeCaseId = guaranteeCaseId;
    if (diagnosticTechId) where.diagnosticTechId = diagnosticTechId;
    if (repairTechId) where.repairTechId = repairTechId;
    if (vehicleProcessingRecordId) {
      vehicleProcessingRecordWhere.vehicleProcessingRecordId =
        vehicleProcessingRecordId;
    }
    if (serviceCenterId) {
      serviceCenterWhere.serviceCenterId = serviceCenterId;
    }

    const { count, rows } = await CaseLine.findAndCountAll({
      where,
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          attributes: ["guaranteeCaseId", "contentGuarantee", "status"],
          where:
            Object.keys(guaranteeCaseWhere).length > 0
              ? guaranteeCaseWhere
              : undefined,
          required: true,
          include: [
            {
              model: VehicleProcessingRecord,
              as: "vehicleProcessingRecord",
              attributes: ["vehicleProcessingRecordId", "vin"],
              where:
                Object.keys(vehicleProcessingRecordWhere).length > 0
                  ? vehicleProcessingRecordWhere
                  : undefined,
              required: true,

              include: [
                {
                  model: User,
                  as: "createdByStaff",
                  attributes: ["userId", "serviceCenterId"],
                  where:
                    Object.keys(serviceCenterWhere).length > 0
                      ? serviceCenterWhere
                      : undefined,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "diagnosticTechnician",
          attributes: ["userId", "name", "email"],
        },
        {
          model: User,
          as: "repairTechnician",
          attributes: ["userId", "name", "email"],
        },
        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["typeComponentId", "sku", "name", "price"],
        },
        {
          model: ComponentReservation,
          as: "reservations",
          attributes: ["reservationId", "quantityReserved", "status"],
          required: false,
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    return {
      caseLines: rows.map((row) => row.toJSON()),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  };

  findByProcessingRecordId = async (
    { vehicleProcessingRecordId },
    transaction = null,
    lock = null
  ) => {
    const caseLines = await CaseLine.findAll({
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          where: { vehicleProcessingRecordId },
          attributes: ["guaranteeCaseId"],
        },
      ],
      transaction,
      lock: lock,
    });

    return caseLines.map((cl) => cl.toJSON());
  };

  findPendingApprovalIdsByVehicleProcessingRecordId = async (
    { vehicleProcessingRecordId },
    transaction = null,
    lock = null
  ) => {
    const caseLines = await CaseLine.findAll({
      attributes: ["id"],
      where: {
        status: "PENDING_APPROVAL",
      },
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          attributes: [],
          where: { vehicleProcessingRecordId },
          required: true,
        },
      ],
      transaction,
      lock,
    });

    return caseLines.map((cl) => cl.id ?? cl.toJSON().id);
  };
}

export default CaseLineRepository;
