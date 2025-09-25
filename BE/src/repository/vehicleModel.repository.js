const { VehicleModel } = require("../../models/index");

class VehicleModelRepository {
  async createVehicleModel({
    vehicleModelName,
    yearOfLaunch,
    vehicleCompanyId,
  }) {
    const newVehicleModel = await VehicleModel.create({
      vehicleModelName,
      yearOfLaunch,
      vehicleCompanyId,
    });

    return newVehicleModel;
  }
}

module.exports = new VehicleModelRepository();
