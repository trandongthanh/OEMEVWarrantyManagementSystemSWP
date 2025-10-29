import dayjs from "dayjs";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../error/index.js";
import db from "../models/index.cjs";
import { Transaction } from "sequelize";

class VehicleService {
  #vehicleRepository;
  #customerService;
  #componentRepository;

  constructor({ vehicleRepository, customerService, componentRepository }) {
    this.#vehicleRepository = vehicleRepository;
    this.#customerService = customerService;
    this.#componentRepository = componentRepository;
  }

  getVehicleProfile = async ({ vin, companyId }, option = null) => {
    if (!vin) {
      throw new BadRequestError("vin is required");
    }

    if (!companyId) {
      throw new ForbiddenError("You do not have permission");
    }

    const vehicle = await this.#vehicleRepository.findByVinAndCompany(
      {
        vin: vin,
        companyId: companyId,
      },
      option
    );

    if (!vehicle) {
      return null;
    }

    const formatResult = {
      vin: vehicle?.vin,
      dateOfManufacture: vehicle?.dateOfManufacture,
      placeOfManufacture: vehicle?.placeOfManufacture,
      licensePlate: vehicle?.licensePlate,
      purchaseDate: vehicle?.purchaseDate,
      owner: vehicle?.owner,
      model: vehicle?.model?.modelName,
      company: vehicle?.model?.company?.name,
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
    if (!companyId) {
      throw new ForbiddenError("You do not have permission");
    }

    const isValidDate = this.#validateVehicleDatesWithDayjs(
      purchaseDate,
      dateOfManufacture
    );

    if (!isValidDate.valid) {
      throw new BadRequestError(isValidDate.error);
    }

    return await db.sequelize.transaction(async (t) => {
      let customerId;

      if (ownerId) {
        const customer = await this.#customerService.checkExistCustomerById(
          {
            id: ownerId,
          },
          t,
          Transaction.LOCK.SHARE
        );

        if (!customer) {
          throw new NotFoundError(
            `Cannot find customer with this id: ${ownerId}`
          );
        }

        customerId = ownerId;
      } else if (customer) {
        const isValidCustomer =
          await this.#customerService.checkDuplicateCustomer(
            {
              phone: customer.phone,
              email: customer.email,
            },
            t
          );

        if (isValidCustomer) {
          throw new BadRequestError(
            `Customer already exists with this info ${customer.phone} ${customer.email}`
          );
        }

        const newCustomer = await this.#customerService.createCustomer(
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

      const existingVehicle = await this.getVehicleProfile(
        {
          vin: vin,
          companyId: companyId,
        },
        t
      );
      if (!existingVehicle) {
        throw new NotFoundError(`Vehicle not found with this vin: ${vin}`);
      }

      if (existingVehicle?.owner) {
        throw new ConflictError("This vehicle has owner");
      }

      const vehicle = await this.#vehicleRepository.updateOwner(
        {
          companyId: companyId,
          vin: vin,
          customerId: customerId,
          licensePlate: licensePlate,
          purchaseDate: purchaseDate,
        },
        t
      );

      if (!vehicle) {
        throw new ForbiddenError("Cannot update owner for this vehicle");
      }

      const formatResult = {
        vin: vehicle?.vin,
        dateOfManufacture: vehicle?.dateOfManufacture,
        placeOfManufacture: vehicle?.placeOfManufacture,
        licensePlate: vehicle?.licensePlate,
        purchaseDate: vehicle?.purchaseDate,
        owner: vehicle?.owner,
        model: vehicle?.model?.modelName,
        company: vehicle?.model?.company?.name,
      };

      return formatResult;
    });
  };

  findVehicleByVinWithWarranty = async ({ vin, companyId, odometer }) => {
    const existingVehicle =
      await this.#vehicleRepository.findVehicleWithTypeComponentByVin({
        vin: vin,
        companyId,
      });

    if (!existingVehicle) {
      throw new NotFoundError("Vehicle not found");
    }

    const vehicleWithWarranty = this.#checkWarrantyForVehicle({
      vehicle: existingVehicle,
      odometer,
      purchaseDate: dayjs(existingVehicle.purchaseDate),
    });

    return vehicleWithWarranty;
  };

  findVehicleByVinWithWarrantyPreview = async ({
    vin,
    companyId,
    odometer,
    purchaseDate,
  }) => {
    const purchaseDateFormatted = dayjs(purchaseDate);

    if (
      purchaseDateFormatted.isAfter(dayjs()) ||
      !purchaseDateFormatted.isValid()
    ) {
      throw new BadRequestError("Valid purchase date is required");
    }

    const existingVehicle =
      await this.#vehicleRepository.findVehicleWithTypeComponentByVin({
        vin: vin,
        companyId,
      });

    if (!existingVehicle) {
      throw new NotFoundError("Vehicle not found");
    }

    const vehicleWithWarranty = this.#checkWarrantyForVehicle({
      vehicle: existingVehicle,
      odometer,
      purchaseDate: purchaseDateFormatted,
    });

    return vehicleWithWarranty;
  };

  #validateVehicleDatesWithDayjs(purchaseDateStr, dateOfManufactureStr) {
    const purchaseDate = dayjs(purchaseDateStr);
    const dateOfManufacture = dayjs(dateOfManufactureStr);

    if (!purchaseDate.isValid() || !dateOfManufacture.isValid()) {
      return false;
    }

    const today = dayjs();

    if (purchaseDate.isBefore(dateOfManufacture)) {
      return {
        valid: false,
        error: "Purchase date cannot be before manufacture date",
      };
    }

    if (purchaseDate.isAfter(today)) {
      return { valid: false, error: "Purchase date cannot be in the future" };
    }

    return { valid: true };
  }

  #checkWarrantyForVehicle({ vehicle, odometer, purchaseDate }) {
    const vehicleModel = vehicle?.model;

    const generalWarrantyDurationFormated = this.#checkWarrantyStatusByDuration(
      purchaseDate,
      vehicleModel?.generalWarrantyDuration
    );

    const dateOfManufacture = dayjs(vehicle?.dateOfManufacture);

    if (purchaseDate.isBefore(dateOfManufacture, "day")) {
      throw new BadRequestError(
        "Purchase date must be after date of manufacture"
      );
    }

    const generalWarrantyMileageFormated = this.#checkWarrantyStatusByMileage(
      vehicleModel?.generalWarrantyMileage,
      odometer
    );

    const typeComponents = vehicle?.model?.typeComponents || [];

    const typeComponentsWarrantyFormated = typeComponents.map((component) => {
      const warrantyComponent = component?.WarrantyComponent;

      if (!warrantyComponent) {
        return {
          typeComponentId: component.typeComponentId,
          componentName: component.name,
          policy: {
            durationMonths: 0,
            mileageLimit: 0,
          },
          duration: {
            status: "EXPIRED",
            endDate: null,
            remainingDays: 0,
            overdueDays: 0,
          },
          mileage: {
            status: "EXPIRED",
            remainingMileage: 0,
            overdueMileage: 0,
          },
        };
      }

      const checkWarrantyComponent = this.#checkWarrantyStatusByDuration(
        purchaseDate,
        warrantyComponent.durationMonth
      );

      const checkWarrantyByMileage = this.#checkWarrantyStatusByMileage(
        warrantyComponent.mileageLimit,
        odometer
      );

      return {
        typeComponentId: component.typeComponentId,
        componentName: component.name,
        policy: {
          durationMonths: warrantyComponent.durationMonth,
          mileageLimit: warrantyComponent.mileageLimit,
        },
        duration: {
          status: checkWarrantyComponent.status,

          endDate: checkWarrantyComponent.endDate,

          remainingDays: checkWarrantyComponent?.remainingDays ?? 0,

          overdueDays: checkWarrantyComponent?.overdueDays ?? 0,
        },
        mileage: {
          status: checkWarrantyByMileage?.status,
          remainingMileage: checkWarrantyByMileage?.remainingMileage ?? 0,

          overdueMileage: checkWarrantyByMileage?.overdueMileage ?? 0,
        },
      };
    });

    const formatVehicle = {
      vin: vehicle?.vin,
      purchaseDate: purchaseDate,
      currentOdometer: odometer,
      generalWarranty: {
        policy: {
          durationMonths: vehicleModel?.generalWarrantyDuration,
          mileageLimit: vehicleModel?.generalWarrantyMileage,
        },
        duration: {
          status: generalWarrantyDurationFormated?.status,
          endDate: generalWarrantyDurationFormated?.endDate,
          remainingDays: generalWarrantyDurationFormated?.remainingDays,
        },
        mileage: {
          status: generalWarrantyMileageFormated?.status,

          remainingMileage:
            generalWarrantyMileageFormated?.remainingMileage ?? 0,

          overdueMileage: generalWarrantyMileageFormated?.overdueMileage ?? 0,
        },
      },
      componentWarranties: typeComponentsWarrantyFormated,
    };

    return formatVehicle;
  }

  #checkWarrantyStatusByDuration(purchase, duration) {
    const purchaseDate = dayjs(purchase);

    const expiresDate = purchaseDate.add(duration, "month");

    const today = dayjs();

    const isExpired = expiresDate.isBefore(today);

    const endDate = expiresDate.format("YYYY-MM-DD");

    if (isExpired) {
      const overdueDays = today.diff(expiresDate, "day");

      return {
        status: "INACTIVE",
        endDate: endDate,
        overdueDays: overdueDays,
      };
    }

    const remainingDays = expiresDate.diff(today, "day");

    const result = {
      status: "ACTIVE",
      endDate: endDate,
      remainingDays: remainingDays,
    };

    return result;
  }

  #checkWarrantyStatusByMileage(warrantyMileage, currentMileage) {
    const isExpired = currentMileage > warrantyMileage;

    if (isExpired) {
      const overdueMileage = currentMileage - warrantyMileage;
      return {
        status: "INACTIVE",
        overdueMileage: overdueMileage,
      };
    } else {
      const remainingMileage = warrantyMileage - currentMileage;

      return {
        status: "ACTIVE",
        remainingMileage: remainingMileage,
      };
    }
  }
}

export default VehicleService;
