import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../error/index.js";
import db from "../../models/index.cjs";
import { checkWarrantyStatus } from "../util/checkWarrantyStatus.js";

class VehicleService {
  constructor({
    vehicleRepository,
    customerService,
    validateVehicleDatesWithDayjs,
  }) {
    this.vehicleRepository = vehicleRepository;
    this.customerService = customerService;
    this.validateVehicleDatesWithDayjs = validateVehicleDatesWithDayjs;
  }

  findVehicleByVin = async ({ vehicleVin, companyId }, option = null) => {
    if (!vehicleVin || !companyId) {
      throw new BadRequestError("vin, companyId is required");
    }

    const vehicle = await this.vehicleRepository.findVehicleByVinWithOwner(
      {
        vin: vehicleVin,
        companyId: companyId,
      },
      option
    );

    if (!vehicle) {
      return null;
    }

    if (!vehicle.model?.company) {
      throw new ForbiddenError(
        `You do not have permission to access vehicle with this VIN: ${vehicleVin}`
      );
    }

    const formatResult = {
      vin: vehicle.vin,
      dateOfManufacture: vehicle.dateOfManufacture,
      placeOfManufacture: vehicle.placeOfManufacture,
      licensePlate: vehicle.licensePlate,
      purchaseDate: vehicle.purchaseDate,
      owner: vehicle.owner,
      model: vehicle.model?.modelName,
      company: vehicle.model?.company?.name,
    };

    return formatResult;
  };

  registerOwnerForVehicle = async ({
    customer,
    vin,
    ownerId,
    companyId,
    dateOfManufacture,
    licensePlate,
    purchaseDate,
  }) => {
    if (ownerId && customer) {
      throw new BadRequestError("You just provice customerId or customer");
    }

    if (!vin || !licensePlate || !purchaseDate || !dateOfManufacture) {
      throw new BadRequestError(
        "licensePlate, purchaseDate, dateOfManufacture, customerId is required"
      );
    }

    const isValidDate = this.validateVehicleDatesWithDayjs(
      purchaseDate,
      dateOfManufacture
    );

    if (!isValidDate) {
      throw new BadRequestError("Purchasedate or dateOfmanufacture is invalid");
    }

    return await db.sequelize.transaction(async (t) => {
      let customerId;

      if (ownerId) {
        await this.customerService.checkCustomerById(
          {
            id: ownerId,
          },
          t
        );

        customerId = ownerId;
      } else if (customer) {
        await this.customerService.checkduplicateCustomer(
          {
            phone: customer.phone,
            email: customer.email,
          },
          t
        );

        const newCustomer = await this.customerService.createCustomer(
          customer,
          t
        );

        customerId = newCustomer.id;
      } else {
        throw new BadRequestError(
          "Client must provide customer or customerId to register for owner for vehicle"
        );
      }

      const existingVehicle = await this.findVehicleByVin(
        {
          vehicleVin: vin,
          companyId: companyId,
        },
        t
      );

      if (existingVehicle.owner) {
        throw new ConflictError("This vehicle has owner");
      }

      const vehicle = await this.vehicleRepository.registerOwnerForVehicle(
        {
          companyId: companyId,
          vin: vin,
          customerId: customerId,
          licensePlate: licensePlate,
          purchaseDate: purchaseDate,
        },
        t
      );

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
    });
  };

  findVehicleByVinWithWarranty = async ({ vin, companyId, odometer }) => {
    if (!vin || !companyId) {
      throw new BadRequestError("vin and companyId is required");
    }

    const existingVehicle =
      await this.vehicleRepository.findVehicleByVinWithWarranty({
        vin: vin,
        companyId,
      });

    const generalWarrantyDurationFormated = checkWarrantyStatus(
      existingVehicle.purchaseDate,
      existingVehicle.model.generalWarrantyDuration
    );

    const typeComponentsWarrantyFormated =
      existingVehicle.model.typeComponents.map((component) => {
        const checkWarrantyComponent = checkWarrantyStatus(
          existingVehicle.purchaseDate,
          component.WarrantyComponent.durationMonth
        );

        return {
          name: component.name,
          status:
            component.WarrantyComponent.mileageLimit > odometer &&
            checkWarrantyComponent.status,
          remainingDays: checkWarrantyComponent.remainingDays,
        };
      });

    const formatVehicle = {
      vin: existingVehicle.vin,
      dateOfManufacture: existingVehicle.dateOfManufacture,
      placeOfManufacture: existingVehicle.placeOfManufacture,
      licensePlate: existingVehicle.licensePlate,
      purchaseDate: existingVehicle.purchaseDate,
      generalWarrantyDuration: generalWarrantyDurationFormated,
      generalWarrantyMileage:
        existingVehicle.model.generalWarrantyMileage > odometer,
      componetWarranty: typeComponentsWarrantyFormated,
    };

    return formatVehicle;
  };
}

export default VehicleService;
