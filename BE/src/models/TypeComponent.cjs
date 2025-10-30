module.exports = (sequelize, DataTypes) => {
  const TypeComponent = sequelize.define(
    "TypeComponent",
    {
      typeComponentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "type_component_id",
      },

      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "name",
      },

      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: "price",
      },

      sku: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: "sku",
      },

      category: {
        type: DataTypes.ENUM(
          // === EV Specific Systems ===
          "HIGH_VOLTAGE_BATTERY", // Pin Cao áp & BMS
          "POWERTRAIN", // Động cơ điện, Biến tần, Hộp số
          "CHARGING_SYSTEM", // Hệ thống Sạc & Cổng sạc
          "THERMAL_MANAGEMENT", // Quản lý nhiệt (Pin & Động cơ)

          // === Standard Systems ===
          "LOW_VOLTAGE_SYSTEM", // Hệ thống điện 12V & Phụ kiện
          "BRAKING", // Hệ thống Phanh (bao gồm cả phanh tái sinh)
          "SUSPENSION_STEERING", // Hệ thống Treo & Lái
          "HVAC", // Điều hòa không khí Cabin
          "BODY_CHASSIS", // Thân vỏ & Khung gầm
          "INFOTAINMENT_ADAS" // Thông tin giải trí & Hỗ trợ lái
        ),
        allowNull: false,
        field: "category",
      },
    },
    {
      tableName: "type_component",
    }
  );

  TypeComponent.associate = function (models) {
    TypeComponent.hasMany(models.Component, {
      foreignKey: "type_component_id",
      as: "components",
    });

    TypeComponent.belongsToMany(models.Warehouse, {
      through: models.Stock,
      foreignKey: "type_component_id",
      as: "warehouses",
    });

    TypeComponent.belongsToMany(models.VehicleModel, {
      through: models.WarrantyComponent,
      foreignKey: "type_component_id",
      as: "vehicleModels",
    });

    // TypeComponent.hasMany(models.CaseLine, {
    //   foreignKey: "component_id",
    //   as: "usageCaseLines",
    // });
  };

  return TypeComponent;
};
