const {
  Vehicle,
  VehicleModel,
  TypeComponent,
  WarrantyPolicy,
  Customer,
} = require("../../models/index");
const { calculateExpiationDates } = require("../../util");

class VehicleRepository {
  async registerVehicleWithCustomer({
    vin,
    licensePlate,
    purchaseDate,
    ownerId,
  }) {
    const rowEffect = await Vehicle.update(
      {
        licensePlate,
        purchaseDate,
        ownerId,
      },
      {
        where: {
          vin: vin,
        },
      }
    );

    if (rowEffect === 0) {
      return null;
    }

    const updatedVehicle = await Vehicle.findOne({
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
          attributes: ["vehicleModelName", "yearOfLaunch"],
        },
      ],
    });

    return updatedVehicle;
  }

  async checkWarrantyByVin({ vin }) {
    //find vehicle
    const vehicle = await Vehicle.findOne({
      where: {
        vin: vin,
      },

      include: [
        {
          model: VehicleModel,
          as: "model",

          include: [
            {
              model: TypeComponent,
              as: "typeComponents",
              through: {
                attributes: [],
              },
              include: {
                model: WarrantyPolicy,
                as: "specificPolicy",
              },
            },
            {
              model: WarrantyPolicy,
              as: "mainPolicy",
            },
          ],
        },
      ],
    });

    if (!vehicle) {
      return null;
    }

    const typeComponentWarranty = calculateExpiationDates({ vehicle: vehicle });

    return {
      vin: vehicle.vin,
      purchaseDate: vehicle.purchaseDate,
      model: vehicle.model,
      mainPolicy: vehicle.model.mainPolicy,

      components_warranty: typeComponentWarranty,
    };
  }

  async findVehicleByVin({ vin }) {
    const vehicle = await Vehicle.findOne({
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
          attributes: ["vehicleModelName", "yearOfLaunch"],
        },
      ],
    });

    return vehicle;
  }
}

module.exports = new VehicleRepository();
