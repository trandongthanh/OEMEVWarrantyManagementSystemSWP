module.exports = (sequelize, DataTypes) => {
  const Component = sequelize.define(
    "Component",
    {
      componentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "component_id",
      },

      typeComponentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "type_component_id",
      },

      serialNumber: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        field: "serial_number",
      },

      warehouseId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "warehouse_id",
      },

      status: {
        type: DataTypes.ENUM(
          "IN_WAREHOUSE",
          "RESERVED",
          "IN_TRANSIT",
          "WITH_TECHNICIAN",
          "INSTALLED",
          "RETURNED"
        ),
        allowNull: false,
        defaultValue: "IN_WAREHOUSE",
        field: "status",
      },

      currentHolderId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "current_holder_id",
      },

      requestId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "request_id",
      },

      vehicleVin: {
        type: DataTypes.STRING(17),
        allowNull: true,
        field: "vehicle_vin",
      },

      installedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "installed_at",
      },
    },
    {
      tableName: "component",
    }
  );

  Component.associate = function (models) {
    Component.belongsTo(models.TypeComponent, {
      foreignKey: "type_component_id",
      as: "typeComponent",
    });

    Component.belongsTo(models.Warehouse, {
      foreignKey: "warehouse_id",
      as: "warehouse",
    });

    Component.belongsTo(models.User, {
      foreignKey: "current_holder_id",
      as: "currentHolder",
    });

    Component.belongsTo(models.Vehicle, {
      foreignKey: "vehicle_vin",
      targetKey: "vin",
      as: "vehicle",
    });

    Component.hasMany(models.ComponentReservation, {
      foreignKey: "component_id",
      as: "reservations",
    });

    Component.belongsTo(models.StockTransferRequest, {
      foreignKey: "request_id",
      as: "stockTransferRequest",
    });
  };

  return Component;
};
