import db from "../models/index.cjs";

const { VehicleModel, WarrantyComponent, TypeComponent } = db;

class OemVehicleModelRepository {
  create = async (vehicleModelData, transaction = null) => {
    const record = await VehicleModel.create(vehicleModelData, {
      transaction,
    });
    return record.toJSON();
  };

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
          model: WarrantyComponent,
          as: "warrantyComponents",
          include: [
            {
              model: TypeComponent,
              as: "typeComponent",
              attributes: ["name", "sku", "price", "category"],
            },
          ],
        },
      ],
      transaction,
    });
    return records.map((record) => record.toJSON());
  };
}

export default OemVehicleModelRepository;
