import db from "../models/index.cjs";

const { TypeComponent, VehicleModel, Warehouse } = db;

class TypeComponentRepository {
  findByPk = async (typeComponentId, transaction) => {
    return await TypeComponent.findByPk(typeComponentId, {
      attributes: ["name"],
      transaction: transaction,
    });
  };
}

export default TypeComponentRepository;
