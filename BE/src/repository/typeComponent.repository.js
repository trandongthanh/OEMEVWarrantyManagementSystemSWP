import db from "../models/index.cjs";

const { TypeComponent, VehicleModel, Warehouse } = db;

class TypeComponentRepository {
  findByPk = async (typeComponentId, transaction) => {
    return await TypeComponent.findByPk(typeComponentId, {
      attributes: ["name"],
      transaction: transaction,
    });
  };

  findAll = async (transaction = null) => {
    const typeComponents = await TypeComponent.findAll({
      attributes: ["typeComponentId", "sku", "name", "price", "category"],
      transaction: transaction,
    });

    return typeComponents ? typeComponents.map(tc => tc.toJSON()) : [];
  };
}

export default TypeComponentRepository;
