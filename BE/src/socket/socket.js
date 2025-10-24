import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import { messageSchema } from "../validators/message.validator.js";
import dayjs from "dayjs";
import { BadRequestError, NotFoundError } from "../error/index.js";
import container from "../../container.js";

import db from "../models/index.cjs";

const { Message, Conversation } = db;

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const notificationNamespace = io.of("/notifications");
  const chatNamespace = io.of("/chats");

  notificationNamespace.use(socketAuth);
  notificationNamespace.on("connection", (socket) => {
    const { userId, roleName, serviceCenterId } = socket.user;

    if (roleName && serviceCenterId) {
      socket.join(`user_${userId}`);
    }

    if (roleName === "service_center_technician" && serviceCenterId) {
      const roomName = `service_center_technician_${serviceCenterId}`;
      socket.join(roomName);
    }

    if (roleName === "service_center_staff" && serviceCenterId) {
      const roomName = `service_center_staff_${serviceCenterId}`;
      socket.join(roomName);

      const rooms = Array.from(socket.rooms);
    }

    if (roleName === "service_center_manager" && serviceCenterId) {
      const roomName = `service_center_manager_${serviceCenterId}`;
      socket.join(roomName);
    }

    socket.on("disconnect", () => {
      console.log("User disconnected: " + roleName + " - " + socket.id);
    });
  });

  chatNamespace.on("connection", (socket) => {
    socket.container = container;

    socket.on("joinRoom", ({ conversationId }) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on("typing", ({ conversationId }) => {
      socket.broadcast.to(`conversation_${conversationId}`).emit("userTyping", {
        userId: socket.id,
        message: "typing....",
      });
    });

    socket.on("sendMessage", async (dataMessage) => {
      const { conversationId, senderId, senderType, content, timestamp } =
        dataMessage;

      const { error } = messageSchema.validate({
        conversationId,
        senderId,
        senderType,
        content,
      });

      if (error) {
        throw new BadRequestError(error.details[0].message);
      }

      const chatService = socket.container.resolve("chatService");

      const rawResult = await chatService.sendMessage({
        conversationId,
        senderId,
        senderType,
        content,
      });

      socket.to(`conversation_${conversationId}`).emit("newMessage", {
        sendAt: dayjs(),
        newMessage: rawResult,
      });
    });
    socket.on("disconnect", () => {
      console.log("User disconnected from chat: " + socket.id);
    });
  });

  return { io, notificationNamespace, chatNamespace };
}
