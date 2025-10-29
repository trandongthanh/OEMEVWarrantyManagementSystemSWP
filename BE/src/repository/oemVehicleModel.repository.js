import db from "../models/index.cjs";

const { VehicleModel } = db;

class OemVehicleModelRepository {
  createVehicleModel = async (vehicleModelData, transaction = null) => {
    return await VehicleModel.create(vehicleModelData, {
      transaction: transaction,
    });
  };
}

export default OemVehicleModelRepository;
