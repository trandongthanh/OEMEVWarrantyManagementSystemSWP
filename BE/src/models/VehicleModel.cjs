module.exports = (sequelize, DataTypes) => {
  const VehicleModel = sequelize.define(
    "VehicleModel",
    {
      vehicleModelId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "vehicle_model_id",
      },
      vehicleModelName: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "vehicle_model_name",
      },
      yearOfLaunch: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "year_of_launch",
      },
      generalWarrantyDuration: {
        type: DataTypes.INTEGER,
        field: "general_warranty_duration",
      },
      generalWarrantyMileage: {
        type: DataTypes.INTEGER,
        field: "general_warranty_mileage",
      },
      vehicleCompanyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "vehicle_company_id",
      },
    },
    {
      tableName: "vehicle_model",
    }
  );

  VehicleModel.associate = function (models) {
    VehicleModel.hasMany(models.Vehicle, {
      foreignKey: "vehicle_model_id",
      as: "vehicles",
    });

    VehicleModel.belongsTo(models.VehicleCompany, {
      foreignKey: "vehicle_company_id",
      as: "company",
    });

    VehicleModel.belongsToMany(models.TypeComponent, {
      through: models.WarrantyComponent,
      foreignKey: "vehicle_model_id",
      as: "typeComponents",
    });

    // VehicleModel.belongsToMany(models.Campaign, {
    //   through: models.VehicleModelCampaign,
    //   foreignKey: "vehicle_model_id",
    //   as: "campaigns",
    // });
  };

  return VehicleModel;
};
