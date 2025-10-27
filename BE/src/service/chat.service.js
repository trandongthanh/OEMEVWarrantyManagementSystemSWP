import { Transaction } from "sequelize";
import { NotFoundError } from "../error/index.js";
import db from "../models/index.cjs";

class ChatService {
  #guestRepository;
  #conversationRepository;
  #notificationService;
  #messageRepository;
  #chats;

  constructor({
    guestRepository,
    conversationRepository,
    notificationService,
    messageRepository,
    chats,
  }) {
    this.#guestRepository = guestRepository;
    this.#conversationRepository = conversationRepository;
    this.#notificationService = notificationService;
    this.#messageRepository = messageRepository;
    this.#chats = chats;
  }

  startAnonymousChat = async ({ guestId, serviceCenterId }) => {
    const rawtResult = await db.sequelize.transaction(async (t) => {
      const guest = await this.#guestRepository.findOrCreate(guestId, t);

      const conversation = await this.#conversationRepository.create(
        {
          guestId: guest.guestId,
        },
        t
      );

      return conversation;
    });

    const roomName = `service_center_staff_${serviceCenterId}`;
    const eventName = "newConversation";
    const data = {
      conversationId: rawtResult.id,
      guestId: guestId,
      serviceCenterId: serviceCenterId,
    };

    this.#notificationService.sendToRoom(roomName, eventName, data);

    return rawtResult;
  };

  joinAnonymousChat = async ({ userId, conversationId }) => {
    const rawResult = await db.sequelize.transaction(async (t) => {
      const existingConversation = await this.#conversationRepository.findById(
        {
          conversationId,
        },
        t,
        Transaction.LOCK.UPDATE
      );

      if (!existingConversation) {
        throw new NotFoundError("Conversation not found.");
      }

      const updatedConversation =
        await this.#conversationRepository.updateStaffId(
          conversationId,
          {
            staffId: userId,
            status: "ACTIVE",
          },
          t
        );

      return updatedConversation;
    });

    const room = `conversation_${conversationId}`;

    const event = "chatAccepted";

    const data = {
      conversationId: conversationId,
      staffId: userId,
    };

    this.#chats.to(room).emit(event, data);

    return rawResult;
  };

  sendMessage = async ({ conversationId, senderId, senderType, content }) => {
    const rawResult = await db.sequelize.transaction(async (t) => {
      const conversation = await this.#conversationRepository.findById(
        { conversationId },
        t
      );

      if (!conversation) {
        throw new NotFoundError("Conversation not found.");
      }

      const message = await this.#messageRepository.createMessage(
        { conversationId, senderId, senderType, content },
        t
      );

      await this.#conversationRepository.updateLastMessageAt(conversationId, t);

      return message;
    });

    return rawResult;
  };

  getMessages = async ({ conversationId }) => {
    const conversation = await this.#conversationRepository.findById({
      conversationId,
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found.");
    }

    const messages = await this.#messageRepository.getMessagesByConversation(
      conversationId
    );

    return messages;
  };

  getMyConversations = async ({ userId }) => {
    const conversations =
      await this.#conversationRepository.getConversationsByStaffId(userId);

    return conversations;
  };

  closeConversation = async ({ conversationId, userId }) => {
    const updatedConversation = await db.sequelize.transaction(async (t) => {
      const conversation = await this.#conversationRepository.findById(
        { conversationId },
        t
      );

      if (!conversation) {
        throw new NotFoundError("Conversation not found.");
      }

      if (conversation.staffId !== userId) {
        throw new Error("Only assigned staff can close this conversation.");
      }

      if (conversation.status !== "ACTIVE") {
        throw new Error("Conversation is not active.");
      }

      // Pass transaction to closeConversation
      const updatedConversation =
        await this.#conversationRepository.closeConversation(conversationId, t);

      return updatedConversation;
    });

    const room = `conversation_${conversationId}`;
    const event = "conversationClosed";
    const data = {
      conversationId,
      closedBy: userId,
      closedAt: new Date(),
    };

    this.#chats.to(room).emit(event, data);

    return updatedConversation;
  };
}

export default ChatService;
