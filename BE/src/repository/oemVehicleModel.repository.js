import db from "../models/index.cjs";

const { VehicleModel } = db;

class OemVehicleModelRepository {
  createVehicleModel = async (vehicleModelData, transaction = null) => {
    const record = await VehicleModel.create(vehicleModelData, {
      transaction: transaction,
    });

    return record.toJSON();
  };
}

export default OemVehicleModelRepository;
