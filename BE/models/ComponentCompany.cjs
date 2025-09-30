module.exports = (sequelize, DataTypes) => {
  const ComponentCompany = sequelize.define(
    "ComponentCompany",
    {
      componentCompanyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "component_company_id",
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
      tableName: "component_company",
    }
  );

  ComponentCompany.associate = function (models) {
    ComponentCompany.belongsToMany(models.TypeComponent, {
      through: models.TypeComponentByCompany,
      foreignKey: "component_company_id",
      as: "typeComponents",
    });
  };

  return ComponentCompany;
};
