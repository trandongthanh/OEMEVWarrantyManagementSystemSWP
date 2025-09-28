import { BadRequestError, ConflictError } from "../error/index.js";

class VehicleService {
  constructor({ vehicleRepository, validateVehicleDatesWithDayjs }) {
    this.vehicleRepository = vehicleRepository;
    this.validateVehicleDatesWithDayjs = validateVehicleDatesWithDayjs;
  }

  findVehicleByVin = async ({ vehicleVin, companyId }) => {
    if (!vehicleVin || !companyId) {
      throw new BadRequestError("vin, companyId is required");
    }

    const vehicle = await this.vehicleRepository.findVehicleByVinWithOwner({
      vin: vehicleVin,
      companyId: companyId,
    });

    console.log("Vehicle serviceL ", vehicle);

    if (!vehicle.model) {
      return null;
    }

    const formatResult = {
      vin: vehicle.vin,
      dateOfManufacture: vehicle.dateOfManufacture,
      placeOfManufacture: vehicle.dateOfManufacture,
      licensePlate: vehicle.licensePlate,
      purchaseDate: vehicle.purchaseDate,
      owner: vehicle.owner,
      model: vehicle.model.dataValues.modelName,
      company: vehicle.model.company.name,
    };

    return formatResult;
  };

  registerOwnerForVehicle = async ({
    companyId,
    vin,
    customerId,
    dateOfManufacture,
    licensePlate,
    purchaseDate,
  }) => {
    if (!vin || !customerId || !licensePlate || !purchaseDate) {
      throw new BadRequestError(
        "vin, customerId, licensePlate, purchaseDate is required"
      );
    }

    const isValidDate = this.validateVehicleDatesWithDayjs(
      purchaseDate,
      dateOfManufacture
    );

    if (!isValidDate) {
      throw new BadRequestError("Purchasedate or dateOfmanufacture is invalid");
    }

    const existingVehicle = await this.findVehicleByVin({
      vehicleVin: vin,
      companyId: companyId,
    });

    if (existingVehicle.owner) {
      throw new ConflictError("This vehicle has owner");
    }

    const vehicle = await this.vehicleRepository.registerOwnerForVehicle({
      companyId: companyId,
      vin: vin,
      customerId: customerId,
      licensePlate: licensePlate,
      purchaseDate: purchaseDate,
    });

    console.log("Vehicle: ", vehicle);

    const formatResult = {
      vin: vehicle.vin,
      dateOfManufacture: vehicle.dateOfManufacture,
      placeOfManufacture: vehicle.dateOfManufacture,
      licensePlate: vehicle.licensePlate,
      purchaseDate: vehicle.purchaseDate,
      owner: vehicle.owner,
      model: vehicle.model.dataValues.modelName,
      company: vehicle.model.company.name,
    };

    return formatResult;
  };
}

export default VehicleService;
