module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "id",
      },

      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "full_name",
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "email",
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "phone",
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "address",
      },
    },
    {
      tableName: "customer",
    }
  );

  Customer.associate = function (models) {
    Customer.hasMany(models.Vehicle, {
      foreignKey: "owner_id",
      as: "vehicles",
    });
  };

  return Customer;
};
