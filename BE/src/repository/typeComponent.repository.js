import { Op } from "sequelize";
import db from "../models/index.cjs";

const { TypeComponent, VehicleModel, Warehouse } = db;

class TypeComponentRepository {
  findAndCountAll = async ({
    where,
    limit,
    offset,
    order = [["name", "ASC"]],
  }) => {
    const result = await TypeComponent.findAndCountAll({
      where,
      limit,
      offset,
      order,
    });
    return {
      count: result.count,
      rows: result.rows.map((r) => r.toJSON()),
    };
  };

  findBySkus = async (skus, transaction = null) => {
    if (!skus || skus.length === 0) {
      return [];
    }

    const records = await TypeComponent.findAll({
      where: {
        sku: {
          [Op.in]: skus,
        },
      },
      transaction: transaction,
    });

    return records.map((record) => record.toJSON());
  };

  bulkCreate = async (records, transaction = null) => {
    const created = await TypeComponent.bulkCreate(records, {
      transaction: transaction,
      returning: true,
    });

    return created.map((record) => record.toJSON());
  };

  findByPk = async (typeComponentId, transaction = null) => {
    return await TypeComponent.findByPk(typeComponentId, {
      attributes: ["name"],
      transaction: transaction,
    });
  };

  findByIds = async (typeComponentIds, transaction = null) => {
    const records = await TypeComponent.findAll({
      where: {
        typeComponentId: {
          [Op.in]: typeComponentIds,
        },
      },
      transaction: transaction,
    });

    return records.map((record) => record.toJSON());
  };

  bulkCreateTypeComponents = async (typeComponentsData, transaction = null) => {
    const created = await TypeComponent.bulkCreate(typeComponentsData, {
      transaction: transaction,
    });

    return created.map((record) => record.toJSON());
  };

  findTypeComponentsBySkus = async (skus, transaction = null) => {
    if (!skus || skus.length === 0) {
      return [];
    }

    const typeComponents = await TypeComponent.findAll({
      where: {
        sku: {
          [Op.in]: skus,
        },
      },
      transaction: transaction,
    });

    return typeComponents.map((typeComponent) => typeComponent.toJSON());
  };
}

export default TypeComponentRepository;
