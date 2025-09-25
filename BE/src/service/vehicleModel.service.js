const { BadRequestError } = require("../error");
const VehicleModelRepository = require("../repository/vehicleModel.repository");

class VehicleModelService {
  constructor() {
    this.vehicleModelRepository = VehicleModelRepository;
    this.vehicleModelRepository = VehicleCompanyRepository;
  }

  createVehicleModel = async (vehicleModelData) => {
    const { vehicleModelName, yearOfLaunch, vehicleCompanyId } =
      vehicleModelData;

    if (!vehicleModelName || !yearOfLaunch || !vehicleCompanyId) {
      throw new BadRequestError(
        "vehicleModelName, yearOfLaunch, vehicleCompanyId is required"
      );
    }

    const yearOfLaunchFormated = new Date(yearOfLaunch);
    const now = new Date();
  };
}

module.exports = new VehicleModelService();
