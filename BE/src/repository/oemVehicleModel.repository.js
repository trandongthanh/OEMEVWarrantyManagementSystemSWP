import db from "../models/index.cjs";

const { VehicleModel, WarrantyComponent, TypeComponent } = db;

class OemVehicleModelRepository {
  createVehicleModel = async (vehicleModelData, transaction = null) => {
    const record = await VehicleModel.create(vehicleModelData, {
      transaction,
    });
    return record.toJSON();
  };

  create = this.createVehicleModel;

  findByPk = async (vehicleModelId, transaction = null) => {
    const record = await VehicleModel.findByPk(vehicleModelId, {
      transaction,
    });
    return record ? record.toJSON() : null;
  };

  findByVehicleModelName = async (vehicleModelName, transaction = null) => {
    const record = await VehicleModel.findOne({
      where: { vehicleModelName },
      transaction,
    });
    return record ? record.toJSON() : null;
  };

  findAllWithWarrantyComponents = async (transaction = null) => {
    const records = await VehicleModel.findAll({
      include: [
        {
          model: TypeComponent,
          as: "typeComponents",
          through: {
            attributes: ["durationMonth", "mileageLimit"],
          },
          attributes: ["name", "sku", "price", "category"],
        },
      ],
      transaction,
    });
    return records.map((record) => record.toJSON());
  };

  getAllModelsWithWarranty = async ({ limit, offset, transaction = null }) => {
    const records = await VehicleModel.findAll({
      include: [
        {
          model: TypeComponent,
          as: "typeComponents",
          through: {
            attributes: ["durationMonth", "mileageLimit"],
          },
          attributes: ["name", "sku", "price", "category"],
        },
      ],
      limit,
      offset,
      transaction,
    });
    return records.map((record) => record.toJSON());
  };
}

export default OemVehicleModelRepository;
