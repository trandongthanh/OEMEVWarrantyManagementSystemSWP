module.exports = (sequelize, DataTypes) => {
  const TypeComponentByCompany = sequelize.define(
    "TypeComponentByCompany",
    {
      componentCompanyId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: "component_company_id",
      },
      typeComponentId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: "type_component_id",
      },
    },
    {
      tableName: "comp_type_comp",
      timestamps: true,
    }
  );

  TypeComponentByCompany.associate = function (models) {
    TypeComponentByCompany.belongsTo(models.TypeComponent, {
      foreignKey: "type_component_id",
    });
    TypeComponentByCompany.belongsTo(models.ComponentCompany, {
      foreignKey: "component_company_id",
    });
  };

  return TypeComponentByCompany;
};
