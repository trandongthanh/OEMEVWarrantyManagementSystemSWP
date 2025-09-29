module.exports = (sequelize, DataTypes) => {
  const VehicleModel = sequelize.define(
    "VehicleModel",
    {
      vehicleModelId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
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
      vehicleCompanyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "vehicle_company_id",
      },
      // warrantyPolicyId: {
      //   type: DataTypes.UUID,
      //   field: "warranty_policy_id",
      // },
    },
    {
      tableName: "vehicle_model",
    }
  );

  VehicleModel.associate = function (models) {
    VehicleModel.hasMany(models.Vehicle, {
      foreignKey: "vehicle_model_id",
      as: "vihicles",
    });

    VehicleModel.belongsTo(models.VehicleCompany, {
      foreignKey: "vehicle_company_id",
      as: "company",
    });

    // VehicleModel.belongsToMany(models.TypeComponent, {
    //   through: models.BillOfMaterial,
    //   foreignKey: "vehicle_model_id",
    //   as: "typeComponents",
    // });

    // VehicleModel.belongsTo(models.WarrantyPolicy, {
    //   foreignKey: "warranty_policy_id",
    //   as: "mainPolicy",
    // });

    // VehicleModel.belongsToMany(models.Campaign, {
    //   through: models.VehicleModelCampaign,
    //   foreignKey: "vehicle_model_id",
    //   as: "campaigns",
    // });
  };

  return VehicleModel;
};
