import db from "../models/index.cjs";

const { Message } = db;

class MessageRepository {
  createMessage = async (
    { conversationId, senderId, senderType, content },
    option = null
  ) => {
    const newMessage = await Message.create(
      {
        conversationId,
        senderId,
        senderType,
        content,
      },
      { transaction: option }
    );

    return newMessage.toJSON();
  };

  getMessagesByConversation = async (conversationId, limit = 100) => {
    const messages = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
      limit: limit,
    });

    return messages.map((msg) => msg.toJSON());
  };
}

export default MessageRepository;
