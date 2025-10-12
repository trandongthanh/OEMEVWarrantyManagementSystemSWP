module.exports = (sequelize, DataTypes) => {
  const WarrantyComponent = sequelize.define(
    "WarrantyComponent",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "id",
      },

      vehicleModelId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "vehicle_model_id",
      },

      typeComponentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "type_component_id",
      },

      quantity: {
        type: DataTypes.INTEGER,
        field: "quantity",
      },

      durationMonth: {
        type: DataTypes.INTEGER,
        field: "duration_month",
      },

      mileageLimit: {
        type: DataTypes.INTEGER,
        field: "mileage_limit",
      },
    },
    {
      tableName: "warranty_component",
      indexes: [
        {
          unique: true,
          fields: ["vehicle_model_id", "type_component_id"],
        },
      ],
    }
  );

  WarrantyComponent.associate = function (models) {
    WarrantyComponent.belongsTo(models.VehicleModel, {
      foreignKey: "vehicle_model_id",
      as: "vehicleModel",
    });

    WarrantyComponent.belongsTo(models.TypeComponent, {
      foreignKey: "type_component_id",
      as: "typeComponent",
    });
  };

  return WarrantyComponent;
};
