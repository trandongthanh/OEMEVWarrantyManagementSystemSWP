module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      vin: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          notEmpty: {
            msg: "vin cannot be empty",
          },
        },
        primaryKey: true,
        field: "vin",
      },

      dateOfManufacture: {
        type: DataTypes.DATE,
        validate: {
          notEmpty: {
            msg: "vin cannot be empty",
          },
        },
        field: "date_of_manufacture",
      },

      placeOfManufacture: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            msg: "vin cannot be empty",
          },
        },
        allowNull: false,
        field: "place_of_manufacture",
      },

      vehicleModelId: {
        type: DataTypes.UUID,
        field: "vehicle_model_id",
      },

      licensePlate: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            msg: "licensePlate cannot be empty",
          },
        },
        field: "license_plate",
      },

      ownerId: {
        type: DataTypes.UUID,
        field: "owner_id",
      },

      purchaseDate: {
        type: DataTypes.DATE,
        field: "purchase_date",
      },
    },
    {
      tableName: "vehicle",
    }
  );

  Vehicle.associate = function (models) {
    Vehicle.belongsTo(models.Customer, {
      foreignKey: "owner_id",
      as: "owner",
    });

    Vehicle.belongsTo(models.VehicleModel, {
      foreignKey: "vehicle_model_id",
      as: "model",
    });

    // Vehicle.hasMany(models.Component, {
    //   foreignKey: "vehicle_id",
    //   as: "components",
    // });

    Vehicle.hasOne(models.VehicleProcessingRecord, {
      foreignKey: "vin",
      as: "vehicleRecord",
    });
  };

  return Vehicle;
};
