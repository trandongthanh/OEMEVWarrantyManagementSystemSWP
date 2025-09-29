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

    if (!vehicle.model) {
      return null;
    }

    const formatResult = {
      vin: vehicle.vin,
      dateOfManufacture: vehicle.dateOfManufacture,
      placeOfManufacture: vehicle.placeOfManufacture,
      licensePlate: vehicle.licensePlate,
      purchaseDate: vehicle.purchaseDate,
      owner: vehicle.owner,
      model: vehicle.model.modelName,
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
    if (
      !companyId ||
      !vin ||
      !customerId ||
      !licensePlate ||
      !purchaseDate ||
      !dateOfManufacture
    ) {
      throw new BadRequestError(
        "vin, customerId, licensePlate, purchaseDate, dateOfManufacture, customerId is required"
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

    const formatResult = {
      vin: vehicle.vin,
      dateOfManufacture: vehicle.dateOfManufacture,
      placeOfManufacture: vehicle.placeOfManufacture,
      licensePlate: vehicle.licensePlate,
      purchaseDate: vehicle.purchaseDate,
      owner: vehicle.owner,
      model: vehicle.model.modelName,
      company: vehicle.model.company.name,
    };

    return formatResult;
  };

  findVehicleByVinWithWarranty = async ({ vin, companyId }) => {
    if (!vin || !companyId) {
      throw new BadRequestError("vin and companyId is required");
    }

    const existingVehicle =
      await this.vehicleRepository.findVehicleByVinWithWarranty({
        vin: vin,
        companyId,
      });

    if (!existingVehicle.model) {
      return null;
    }

    if (existingVehicle.model) return existingVehicle;
  };
}

export default VehicleService;
