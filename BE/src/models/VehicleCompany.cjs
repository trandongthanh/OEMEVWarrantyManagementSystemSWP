module.exports = (sequelize, DataTypes) => {
  const VehicleCompany = sequelize.define(
    "VehicleCompany",
    {
      vehicleCompanyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "vehicle_company_id",
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "name",
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "address",
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "phone",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "email",
      },
    },
    {
      tableName: "vehicle_company",
    }
  );

  VehicleCompany.associate = function (models) {
    VehicleCompany.hasMany(models.VehicleModel, {
      foreignKey: "vehicle_company_id",
      as: "models",
    });

    // VehicleCompany.hasMany(models.Warehouse, {
    //   foreignKey: "vehicle_company_id",
    //   as: "warehouses",
    // });

    VehicleCompany.hasMany(models.User, {
      foreignKey: "vehicle_company_id",
      as: "users",
    });

    VehicleCompany.hasMany(models.ServiceCenter, {
      foreignKey: "vehicle_company_id",
      as: "serviceCenters",
    });
  };
  return VehicleCompany;
};
