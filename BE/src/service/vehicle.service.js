const VehicleRepository = require("../repository/vehicle.repository");
const UserRepository = require("../repository/user.repository");
const { BadRequestError, ConflictError, NotFoundError } = require("../error");

class VehicleService {
  constructor() {
    this.vehicleRepository = VehicleRepository;
    this.userRepository = UserRepository;
  }

  async registerVehicleWithCustomer(vehicleData) {
    const { vin, licensePlate, purchaseDate, ownerId } = vehicleData;

    if (!vin || !licensePlate || !purchaseDate || !ownerId) {
      throw new BadRequestError(
        "vin, liscensePlate, vehicleModelId, ownerId  are required"
      );
    }

    // const validateDate =
    //   /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{4})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

    const validateFormat = /^\d{4}-\d{2}-\d{2}$/;

    if (!validateFormat.test(purchaseDate)) {
      throw new BadRequestError(
        "dateOfManuFacture, purchaseDate is required follow format yyyy-mm-dd"
      );
    }

    const newVehicle = await this.vehicleRepository.registerVehicleWithCustomer(
      {
        vin,
        licensePlate,
        purchaseDate,
        ownerId,
      }
    );

    return newVehicle;
  }

  findVehicleByVin = async (vinVehicle) => {
    const { vin } = vinVehicle;

    if (!vin) {
      throw new BadRequestError("vin is required");
    }

    const vehicle = await this.vehicleRepository.findVehicleByVin({ vin: vin });

    if (!vehicle) {
      throw new NotFoundError("Cannot find vehicle with vin");
    }

    return vehicle;
  };
}

module.exports = new VehicleService();
