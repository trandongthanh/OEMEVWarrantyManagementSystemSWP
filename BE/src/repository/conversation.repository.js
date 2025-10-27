import db from "../models/index.cjs";

const { Conversation } = db;

class ConversationRepository {
  create = async ({ guestId }, transaction) => {
    const conversation = await Conversation.create(
      { guestId },
      { transaction }
    );

    return conversation.toJSON();
  };

  findById = async ({ conversationId }, transaction = null, lock = null) => {
    const conversation = await Conversation.findOne({
      where: { id: conversationId },
      transaction: transaction,
      lock: lock,
    });

    return conversation ? conversation.toJSON() : null;
  };

  updateStaffId = async (
    conversationId,
    { staffId, status },
    transaction = null
  ) => {
    const [rowsUpdated] = await Conversation.update(
      { staffId: staffId, status: status },
      {
        where: {
          id: conversationId,
          status: "UNASSIGNED",
        },
        transaction: transaction,
      }
    );

    if (rowsUpdated <= 0) {
      throw new Error(
        "Failed to assign conversation - it may have been already accepted by another staff"
      );
    }

    const updatedConversation = await Conversation.findByPk(conversationId, {
      transaction: transaction,
    });

    if (!updatedConversation) {
      throw new Error("Conversation not found after update");
    }

    return updatedConversation.toJSON();
  };

  closeConversation = async (conversationId, transaction = null) => {
    const [rowsUpdated] = await Conversation.update(
      { status: "CLOSED" },
      {
        where: { id: conversationId },
        transaction: transaction,
      }
    );

    if (rowsUpdated <= 0) {
      throw new Error(
        "Failed to close conversation - conversation not found or already closed"
      );
    }

    const updatedConversation = await Conversation.findByPk(conversationId, {
      transaction: transaction,
    });

    if (!updatedConversation) {
      throw new Error("Conversation not found after update");
    }

    return updatedConversation.toJSON();
  };

  updateLastMessageAt = async (conversationId, transaction = null) => {
    await Conversation.update(
      { lastMessageAt: new Date() },
      {
        where: { id: conversationId },
        transaction: transaction,
      }
    );
  };

  getConversationsByStaffId = async (staffId, transaction = null) => {
    const conversations = await Conversation.findAll({
      where: { staffId: staffId },
      include: [
        {
          model: db.Guest,
          as: "guest",
          attributes: ["guestId"],
        },
        {
          model: db.Message,
          as: "messages",
          attributes: ["content", "createdAt", "senderId", "senderType"],
          separate: true,
          limit: 1,
          order: [["createdAt", "DESC"]],
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
      transaction: transaction,
    });

    return conversations.map((conversation) => conversation.toJSON());
  };
}

export default ConversationRepository;
