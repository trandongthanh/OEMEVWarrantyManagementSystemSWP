import { Op } from "sequelize";
import db from "../models/index.cjs";

const {
  CaseLine,
  GuaranteeCase,
  User,
  TypeComponent,
  ComponentReservation,
  Component,
} = db;

class CaseLineRepository {
  bulkCreate = async ({ caselines }, transaction = null) => {
    const newCaseLines = await CaseLine.bulkCreate(caselines, {
      transaction: transaction,
    });

    if (!newCaseLines) {
      return [];
    }

    return newCaseLines.map((caseLine) => caseLine.toJSON());
  };

  createCaseline = async (caselineData, transaction = null) => {
    const newCaseLine = await CaseLine.create(caselineData, {
      transaction: transaction,
    });

    return newCaseLine ? newCaseLine.toJSON() : null;
  };

  findById = async (caselineId, transaction = null, lock = null) => {
    const caseLine = await CaseLine.findOne({
      include: [
        {
          model: GuaranteeCase,
          as: "guaranteeCase",
          required: true,
        },
      ],
      where: { id: caselineId },
      transaction: transaction,
      lock: lock,
    });

    return caseLine ? caseLine.toJSON() : null;
  };

  bulkUpdateStatusByIds = async (
    { caseLineIds, status },
    transaction = null
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
      }
    );

    if (numberOfAffectedRows === 0) {
      return numberOfAffectedRows;
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
}

export default CaseLineRepository;
