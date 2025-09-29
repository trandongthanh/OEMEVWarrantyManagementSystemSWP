module.exports = (sequelize, DataTypes) => {
  const TypeComponent = sequelize.define(
    "TypeComponent",
    {
      typeComponentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
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
      warrantyPolicyId: {
        type: DataTypes.UUID,
        field: "warranty_policy_id",
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

    TypeComponent.belongsToMany(models.ComponentCompany, {
      through: models.TypeComponentByCompany,
      foreignKey: "type_component_id",
      as: "componentCompanys",
    });

    TypeComponent.belongsToMany(models.VehicleModel, {
      through: models.BillOfMaterial,
      foreignKey: "type_component_id",
      as: "vehicleModel",
    });

    TypeComponent.belongsTo(models.WarrantyPolicy, {
      foreignKey: "warranty_policy_id",
      as: "specificPolicy",
    });
  };

  return TypeComponent;
};
