module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      roleId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        field: "role_id",
      },
      roleName: {
        type: DataTypes.ENUM(
          "service_center_staff",
          "service_center_technician",
          "emv_staff",
          "emv_admin"
        ),
        allowNull: false,
        field: "role_name",
      },
    },
    {
      tableName: "role",
    }
  );

  Role.associate = function (models) {
    Role.hasMany(models.User, {
      foreignKey: "role_id",
      as: "users",
    });
  };

  return Role;
};
