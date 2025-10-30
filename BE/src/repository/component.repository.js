import { Op } from "sequelize";
import db from "../models/index.cjs";

const { Component, TypeComponent } = db;

class ComponentRepository {
  findAll = async (
    { whereCondition, limit },
    transaction = null,
    lock = null
  ) => {
    const components = await Component.findAll({
      where: whereCondition,
      limit,
      transaction,
      lock,
    });

    if (!components || components.length === 0) {
      return [];
    }

    return components.map((component) => component.toJSON());
  };

  findAvailableComponents = async (
    { typeComponentId, warehouseId, limit },
    transaction = null,
    lock = null
  ) => {
    const components = await Component.findAll({
      where: {
        typeComponentId: typeComponentId,
        warehouseId: warehouseId,
        status: "IN_WAREHOUSE",
      },
      limit: limit,
      transaction,
      lock,
    });

    if (!components || components.length === 0) {
      return [];
    }

    return components.map((component) => component.toJSON());
  };

  bulkUpdateStatus = async (
    { componentIds, status, requestId, warehouseId },
    transaction = null
  ) => {
    const updateData = {};

    if (status) {
      updateData.status = status;
    }

    if (requestId) {
      updateData.requestId = requestId;
    }

    if (warehouseId) {
      updateData.warehouseId = warehouseId;
    }

    if (Object.keys(updateData).length === 0) {
      return 0;
    }

    const [numberOfAffectedRows] = await Component.update(updateData, {
      where: {
        componentId: {
          [Op.in]: componentIds,
        },
      },
      transaction: transaction,
    });

    return numberOfAffectedRows;
  };

  updateStatusWithTechnician = async (
    componentId,
    { status },
    transaction = null
  ) => {
    const [rowsUpdated] = await Component.update(
      { status: status, warehouseId: null },
      {
        where: { componentId: componentId },
        transaction: transaction,
      }
    );

    if (rowsUpdated <= 0) {
      return null;
    }

    const component = await Component.findByPk(componentId, {
      transaction: transaction,
    });

    return component ? component.toJSON() : null;
  };

  findById = async (componentId, transaction = null, lock = null) => {
    const component = await Component.findOne({
      where: { componentId },
      transaction: transaction,
      lock: lock,
    });

    return component ? component.toJSON() : null;
  };

  updateInstalledComponentStatus = async (
    {
      vehicleVin,
      componentId,
      installedAt,
      status = "INSTALLED",
      currentHolderId,
    },
    transaction = null
  ) => {
    const [rowsUpdated] = await Component.update(
      {
        status: status,
        vehicleVin: vehicleVin,
        installedAt: installedAt,
        currentHolderId: currentHolderId,
      },
      {
        where: { componentId: componentId },
        transaction: transaction,
      }
    );

    if (rowsUpdated <= 0) {
      return null;
    }

    const updatedComponent = await Component.findByPk(componentId, {
      transaction: transaction,
    });

    return updatedComponent ? updatedComponent.toJSON() : null;
  };

  belongToProcessingByVin = async (
    serialNumber,
    vin,
    transaction = null,
    lock = null
  ) => {
    const component = await Component.findOne({
      where: {
        vehicleVin: vin,
        status: {
          [Op.in]: ["INSTALLED"],
        },
        serialNumber: serialNumber,
      },

      transaction: transaction,
      lock: lock,
    });

    return component ? component.toJSON() : null;
  };

  findBySerialNumber = async (
    serialNumber,
    transaction = null,
    lock = null
  ) => {
    const component = await Component.findOne({
      where: { serialNumber },
      transaction: transaction,
      lock: lock,
    });

    return component ? component.toJSON() : null;
  };

  updateStatusComponentReturn = async (
    componentId,
    { status },
    transaction = null
  ) => {
    const [rowsUpdated] = await Component.update(
      { status: status, vehicleVin: null, installedAt: null },
      {
        where: { componentId: componentId },
        transaction: transaction,
      }
    );

    if (rowsUpdated <= 0) {
      return null;
    }

    const updatedComponent = await Component.findByPk(componentId, {
      transaction: transaction,
    });

    return updatedComponent ? updatedComponent.toJSON() : null;
  };

  findComponentsByStockTransferRequestId = async (
    { requestId },
    transaction = null,
    lock = null
  ) => {
    const components = await Component.findAll({
      where: { stockTransferRequestId: requestId },

      transaction: transaction,
      lock: lock,
    });

    if (!components || components.length === 0) {
      return [];
    }

    return components.map((component) => component.toJSON());
  };

  findComponentInstalledOnVehicle = async (
    { vehicleVin, status },
    transaction = null,
    lock = null
  ) => {
    let whereClause = { vehicleVin: vehicleVin };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const component = await Component.findAll({
      where: whereClause,
      include: [
        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["typeComponentId", "name", "sku", "category", "price"],
        },
      ],
      order: [["installedAt", "DESC"]],
    });

    return component ? component.toJSON() : null;
  };

  findComponentsByRequestId = async (
    { requestId },
    transaction = null,
    lock = null
  ) => {
    const components = await Component.findAll({
      where: { requestId: requestId },
      transaction: transaction,
      lock: lock,
    });

    if (!components || components.length === 0) {
      return [];
    }

    return components.map((component) => component.toJSON());
  };
}

export default ComponentRepository;
