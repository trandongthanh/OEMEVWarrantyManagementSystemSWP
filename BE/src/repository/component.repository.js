import { Op } from "sequelize";
import db from "../models/index.cjs";

const { Component } = db;

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

  bulkUpdateStatus = async ({ componentIds, status }, transaction = null) => {
    const [numberOfAffectedRows] = await Component.update(
      { status: status },
      {
        where: {
          componentId: {
            [Op.in]: componentIds,
          },
        },
        transaction: transaction,
      }
    );

    return numberOfAffectedRows;
  };
}

export default ComponentRepository;
