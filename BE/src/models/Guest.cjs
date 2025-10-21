module.exports = (sequelize, DataTypes) => {
  const Guest = sequelize.define(
    "Guest",
    {
      guestId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "guest_id",
      },
    },
    {
      tableName: "guest",
    }
  );

  Guest.associate = function (models) {
    Guest.hasMany(models.Conversation, {
      foreignKey: "guest_id",
      as: "conversations",
    });
  };

  return Guest;
};
