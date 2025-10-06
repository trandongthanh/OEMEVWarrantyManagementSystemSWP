import { Op } from "sequelize";
import db from "../../models/index.cjs";
const { Vehicle, Customer, VehicleModel, VehicleCompany, TypeComponent } = db;

class VehicleRepository {
  findVehicleByVinWithOwner = async ({ vin, companyId }, option = null) => {
    const existingVehicle = await Vehicle.findOne({
      where: {
        vin: vin,
      },

      attributes: [
        "vin",
        "dateOfManufacture",
        "placeOfManufacture",
        "licensePlate",
        "purchaseDate",
      ],

      include: [
        {
          model: Customer,
          as: "owner",

          attributes: ["fullName", "email", "phone", "address"],
        },

        {
          model: VehicleModel,
          as: "model",
          attributes: [["vehicle_model_name", "modelName"]],
          required: true,

          include: [
            {
              model: VehicleCompany,
              as: "company",
              where: { vehicleCompanyId: companyId },
              attributes: ["name", "vehicleCompanyId"],
              required: false,
            },
          ],
        },
      ],

      transaction: option,
    });

    if (!existingVehicle) {
      return null;
    }

    return existingVehicle.toJSON();
  };

  registerOwnerForVehicle = async (
    { companyId, vin, customerId, licensePlate, purchaseDate },
    option = null
  ) => {
    const rowEffect = await Vehicle.update(
      {
        ownerId: customerId,
        licensePlate: licensePlate,
        purchaseDate: purchaseDate,
      },
      {
        where: {
          vin: vin,
        },
        transaction: option,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedVehicle = await this.findVehicleByVinWithOwner(
      {
        vin: vin,
        companyId: companyId,
      },
      option
    );

    return updatedVehicle;
  };

  findVehicleByVinWithWarranty = async ({ vin, companyId }) => {
    const existingVehicle = await Vehicle.findOne({
      where: {
        vin: vin,
        ownerId: {
          [Op.not]: null,
        },
      },

      attributes: [
        "vin",
        "dateOfManufacture",
        "placeOfManufacture",
        "licensePlate",
        "purchaseDate",
      ],

      include: [
        {
          model: VehicleModel,
          as: "model",
          attributes: ["generalWarrantyDuration", "generalWarrantyMileage"],

          include: [
            {
              model: TypeComponent,
              as: "typeComponents",
              attributes: ["name"],
              through: { attributes: ["durationMonth", "mileageLimit"] },
            },

            {
              model: VehicleCompany,
              as: "company",
              where: { vehicleCompanyId: companyId },
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!existingVehicle) {
      return null;
    }

    return existingVehicle.toJSON();
  };

  findVehicleExist = async ({ vin }, option = null) => {
    const existingVehicle = await Vehicle.findOne({
      where: {
        vin: vin,
      },
      transaction: option,
      attributes: ["vin"],
    });

    if (!existingVehicle) {
      return false;
    }

    return true;
  };
}

export default VehicleRepository;
