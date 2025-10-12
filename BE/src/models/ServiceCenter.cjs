module.exports = (sequelize, DataTypes) => {
  const ServiceCenter = sequelize.define(
    "ServiceCenter",
    {
      serviceCenterId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "service_center_id",
      },

      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "name cannot be empty",
          },
        },
        field: "name",
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "address cannot be empty",
          },
        },
        field: "address",
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "phone cannot be empty",
          },
        },
        field: "phone",
      },

      vehicleCompanyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "vehicle_company_id",
      },
    },
    {
      tableName: "service_center",
    }
  );

  ServiceCenter.associate = function (models) {
    ServiceCenter.hasMany(models.User, {
      foreignKey: "service_center_id",
      as: "staffs",
    });

    // ServiceCenter.hasMany(models.Warehouse, {
    //   foreignKey: "service_center_id",
    //   as: "warehouses",
    // });

    ServiceCenter.belongsTo(models.VehicleCompany, {
      foreignKey: "vehicle_company_id",
      as: "vehicleCompany",
    });
  };
  return ServiceCenter;
};
