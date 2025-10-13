import dayjs from "dayjs";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../error/index.js";
import db from "../models/index.cjs";
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

    const vehicle = await this.vehicleRepository.findByVinAndCompanyWithOwner(
      {
        vin: vehicleVin,
        companyId: companyId,
      },
      option
    );

    if (!vehicle) {
      return null;
    }

    // if (!vehicle.model?.company) {
    //   throw new ForbiddenError(
    //     `You do not have permission to access vehicle with this VIN: ${vehicleVin}`
    //   );
    // }

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
      throw new BadRequestError("You just provide customerId or customer");
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

    if (!isValidDate.valid) {
      throw new BadRequestError(isValidDate.error);
    }

    return await db.sequelize.transaction(async (t) => {
      let customerId;

      if (ownerId) {
        await this.customerService.checkExistCustomerById(
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
          {
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
          },
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

      const vehicle = await this.vehicleRepository.assignOwner(
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
          typeComponentId: component.typeComponentId,
          componentName: component.name,
          policy: {
            durationMonths: component.WarrantyComponent.durationMonth,
            mileageLimit: component.WarrantyComponent.mileageLimit,
          },
          duration: {
            status: checkWarrantyComponent.status ? "ACTIVE" : "INACTIVE",

            endDate: checkWarrantyComponent.endDate,
            remainingDays: checkWarrantyComponent.remainingDays,
          },
          mileage: {
            status:
              component.WarrantyComponent.mileageLimit > odometer
                ? "ACTIVE"
                : "INACTIVE",
            remainingMileage:
              component.WarrantyComponent.mileageLimit - odometer,
          },
        };
      });

    const formatVehicle = {
      vin: existingVehicle.vin,
      purchaseDate: existingVehicle.purchaseDate,
      currentOdometer: odometer,
      generalWarranty: {
        policy: {
          durationMonths: existingVehicle.model.generalWarrantyDuration,
          mileageLimit: existingVehicle.model.generalWarrantyMileage,
        },
        duration: {
          status: generalWarrantyDurationFormated.status,
          endDate: generalWarrantyDurationFormated.endDate,
          remainingDays: generalWarrantyDurationFormated.remainingDays,
        },
        mileage: {
          status:
            existingVehicle.model.generalWarrantyMileage > odometer
              ? "ACTIVE"
              : "INACTIVE",
          remainingMileage:
            existingVehicle.model.generalWarrantyMileage - odometer,
        },
      },
      componentWarranties: typeComponentsWarrantyFormated,
    };

    return formatVehicle;
  };

  findVehicleByVinWithWarrantyPreview = async ({
    vin,
    companyId,
    odometer,
    purchaseDate,
  }) => {
    if (!vin || !companyId || !purchaseDate || !odometer) {
      throw new BadRequestError(
        "vin, companyId, purchaseDate and odometer are required"
      );
    }

    if (dayjs(purchaseDate) > dayjs() || !dayjs(purchaseDate).isValid()) {
      throw new BadRequestError("Valid purchase date is required");
    }

    if (odometer < 0) {
      throw new BadRequestError("Odometer must be a positive number");
    }

    const existingVehicle =
      await this.vehicleRepository.findVehicleByVinWithWarranty({
        vin: vin,
        companyId,
      });

    if (!existingVehicle) {
      throw new BadRequestError("Vehicle not found");
    }

    if (
      dayjs(purchaseDate).isBefore(dayjs(existingVehicle.dateOfManufacture))
    ) {
      throw new BadRequestError(
        "Purchase date must be after date of manufacture"
      );
    }

    const generalWarrantyDurationFormated = checkWarrantyStatus(
      purchaseDate,
      existingVehicle.model.generalWarrantyDuration
    );

    const typeComponentsWarrantyFormated =
      existingVehicle.model.typeComponents.map((component) => {
        const checkWarrantyComponent = checkWarrantyStatus(
          purchaseDate,
          component.WarrantyComponent.durationMonth
        );

        return {
          typeComponentId: component.typeComponentId,
          componentName: component.name,
          policy: {
            durationMonths: component.WarrantyComponent.durationMonth,
            mileageLimit: component.WarrantyComponent.mileageLimit,
          },
          duration: {
            status: checkWarrantyComponent.status ? "ACTIVE" : "INACTIVE",
            endDate: checkWarrantyComponent.endDate,
            remainingDays: checkWarrantyComponent.remainingDays,
          },
          mileage: {
            status:
              component.WarrantyComponent.mileageLimit > odometer
                ? "ACTIVE"
                : "INACTIVE",
            remainingMileage:
              component.WarrantyComponent.mileageLimit - odometer,
          },
        };
      });

    const formatVehicle = {
      vin: existingVehicle.vin,
      purchaseDate: purchaseDate,
      currentOdometer: odometer,

      generalWarranty: {
        policy: {
          durationMonths: existingVehicle.model.generalWarrantyDuration,
          mileageLimit: existingVehicle.model.generalWarrantyMileage,
        },
        duration: {
          status: generalWarrantyDurationFormated.status,
          endDate: generalWarrantyDurationFormated.endDate,
          remainingDays: generalWarrantyDurationFormated.remainingDays,
        },
        mileage: {
          status:
            existingVehicle.model.generalWarrantyMileage > odometer
              ? "ACTIVE"
              : "INACTIVE",
          remainingMileage:
            existingVehicle.model.generalWarrantyMileage - odometer,
        },
      },

      componentWarranties: typeComponentsWarrantyFormated,
    };

    return formatVehicle;
  };
}

export default VehicleService;
