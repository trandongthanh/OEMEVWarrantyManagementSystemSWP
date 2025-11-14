import db from "../models/index.cjs";

const { VehicleModel, WarrantyComponent, TypeComponent } = db;

class OemVehicleModelRepository {
  createVehicleModel = async (vehicleModelData, transaction = null) => {
    const record = await VehicleModel.create(vehicleModelData, {
      transaction: transaction,
    });

    return record.toJSON();
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
