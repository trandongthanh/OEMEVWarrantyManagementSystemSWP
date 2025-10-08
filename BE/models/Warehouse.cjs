module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    "Warehouse",
    {
      warehouseId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "warehouse_id",
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "name",
      },

      address: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "address",
      },

      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 99,
        comment: "Thứ tự ưu tiên khi trừ kho (số nhỏ = ưu tiên cao).",
      },

      vehicleCompanyId: {
        type: DataTypes.UUID,
        field: "vehicle_company_id",
      },

      serviceCenterId: {
        type: DataTypes.UUID,
        field: "service_center_id",
      },
    },
    {
      tableName: "warehouse",
    }
  );

  Warehouse.associate = function (models) {
    Warehouse.belongsToMany(models.TypeComponent, {
      through: models.Stock,
      foreignKey: "warehouse_id",
      as: "typeComponents",
    });
    // Warehouse.hasMany(models.PartShipment, {
    //   foreignKey: "from_warehouse_id",
    //   as: "importedPartMentShips",
    // });
    // Warehouse.hasMany(models.PartShipment, {
    //   foreignKey: "to_warehouse_id",
    //   as: "exportedPartMentShips",
    // });
    Warehouse.belongsTo(models.ServiceCenter, {
      foreignKey: "service_center_id",
      as: "serviceCenter",
    });
    Warehouse.belongsTo(models.VehicleCompany, {
      foreignKey: "vehicle_company_id",
      as: "company",
    });
  };
  return Warehouse;
};
