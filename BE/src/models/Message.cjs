module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "id",
      },

      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "conversations", key: "id" },
        field: "conversation_id",
      },

      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "sender_id",
      },

      senderType: {
        type: DataTypes.ENUM("GUEST", "STAFF"),
        allowNull: false,
        field: "sender_type",
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "content",
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_read",
      },
    },
    {
      tableName: "message",
    }
  );

  Message.associate = function (models) {
    Message.belongsTo(models.Conversation, { foreignKey: "conversation_id" });
  };

  return Message;
};
