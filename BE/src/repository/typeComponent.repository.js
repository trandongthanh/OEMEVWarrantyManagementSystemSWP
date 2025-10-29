import { Op } from "sequelize";
import db from "../models/index.cjs";

const { TypeComponent, VehicleModel, Warehouse } = db;

class TypeComponentRepository {
  findByPk = async (typeComponentId, transaction = null) => {
    return await TypeComponent.findByPk(typeComponentId, {
      attributes: ["name"],
      transaction: transaction,
    });
  };

  findByIds = async (typeComponentIds, transaction = null) => {
    return await TypeComponent.findAll({
      where: {
        typeComponentId: {
          [Op.in]: typeComponentIds,
        },
      },
      transaction: transaction,
    });
  };

  bulkCreateTypeComponents = async (typeComponentsData, transaction = null) => {
    return await TypeComponent.bulkCreate(typeComponentsData, {
      transaction: transaction,
    });
  };
}

export default TypeComponentRepository;
