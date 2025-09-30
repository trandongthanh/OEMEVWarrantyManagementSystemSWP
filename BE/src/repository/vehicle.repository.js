import db from "../../models/index.cjs";
const {
  Vehicle,
  Customer,
  VehicleModel,
  VehicleCompany,
  WarrantyComponent,
  TypeComponent,
} = db;

class VehicleRepository {
  findVehicleByVinWithOwner = async ({ vin, companyId }) => {
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
        },

        {
          model: VehicleModel,
          as: "model",
          attributes: [["vehicle_model_name", "modelName"]],

          include: [
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

    return existingVehicle.toJSON();
  };

  registerOwnerForVehicle = async ({
    companyId,
    vin,
    customerId,
    licensePlate,
    purchaseDate,
  }) => {
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
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedVehicle = await this.findVehicleByVinWithOwner({
      vin: vin,
      companyId: companyId,
    });

    return updatedVehicle;
  };

  findVehicleByVinWithWarranty = async ({ vin, companyId }) => {
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

    return existingVehicle.toJSON();
  };
}

export default VehicleRepository;
