module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "id",
      },
      guestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "guest_id",
      },
      staffId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "staff_id",
      },
      status: {
        type: DataTypes.ENUM("UNASSIGNED", "ACTIVE", "CLOSED"),
        allowNull: false,
        defaultValue: "UNASSIGNED",
        field: "status",
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        field: "last_message_at",
      },
    },
    {
      tableName: "conversation",
    }
  );

  Conversation.associate = function (models) {
    Conversation.belongsTo(models.Guest, {
      foreignKey: "guest_id",
      as: "guest",
    });
    Conversation.belongsTo(models.User, {
      foreignKey: "staff_id",
      as: "staff",
    });
    Conversation.hasMany(models.Message, {
      foreignKey: "conversation_id",
      as: "messages",
    });
  };

  return Conversation;
};
