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
    },
    {
      tableName: "type_component",
    }
  );

  TypeComponent.associate = function (models) {
    // TypeComponent.hasMany(models.Component, {
    //   foreignKey: "type_component_id",
    //   as: "components",
    // });

    // TypeComponent.belongsToMany(models.Warehouse, {
    //   through: models.Stock,
    //   foreignKey: "type_component_id",
    //   as: "warehouses",
    // });

    TypeComponent.belongsToMany(models.ComponentCompany, {
      through: models.TypeComponentByCompany,
      foreignKey: "type_component_id",
      as: "componentCompanies",
    });

    TypeComponent.belongsToMany(models.VehicleModel, {
      through: models.WarrantyComponent,
      foreignKey: "type_component_id",
      as: "vehicleModels",
    });
  };

  return TypeComponent;
};
