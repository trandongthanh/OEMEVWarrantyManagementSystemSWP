import express from "express";
import { authentication } from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /chat/start-anonymous-chat:
 *   post:
 *     summary: Start an anonymous chat session
 *     description: Create a new anonymous chat conversation as a guest user without authentication
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestName
 *               - initialMessage
 *             properties:
 *               guestName:
 *                 type: string
 *                 description: Name of the guest user
 *                 example: "Nguyễn Văn A"
 *               initialMessage:
 *                 type: string
 *                 description: Initial message to start the conversation
 *                 example: "Tôi muốn hỏi về chính sách bảo hành xe điện"
 *     responses:
 *       201:
 *         description: Anonymous chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         conversationId:
 *                           type: string
 *                           format: uuid
 *                           example: "550e8400-e29b-41d4-a716-446655440000"
 *                         guestId:
 *                           type: string
 *                           format: uuid
 *                           example: "550e8400-e29b-41d4-a716-446655440001"
 *                         status:
 *                           type: string
 *                           example: "waiting"
 *                           enum: [waiting, active, closed]
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     message:
 *                       type: object
 *                       properties:
 *                         messageId:
 *                           type: string
 *                           format: uuid
 *                         content:
 *                           type: string
 *                           example: "Tôi muốn hỏi về chính sách bảo hành xe điện"
 *                         senderId:
 *                           type: string
 *                           format: uuid
 *                         sentAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Guest name and initial message are required"
 */
router.post("/start-anonymous-chat", async (req, res, next) => {
  const chatController = req.container.resolve("chatController");

  await chatController.createAnonymousChat(req, res, next);
});

/**
 * @swagger
 * /chat/conversations/{conversationId}/accept:
 *   patch:
 *     summary: Accept and join an anonymous chat conversation
 *     description: Service center staff can accept and join a waiting anonymous chat conversation
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID to accept
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Conversation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         conversationId:
 *                           type: string
 *                           format: uuid
 *                         staffId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         acceptedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Conversation already accepted or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Conversation is already accepted or closed"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Conversation not found"
 */
router.patch(
  "/conversations/:conversationId/accept",
  authentication,
  async (req, res, next) => {
    const chatController = req.container.resolve("chatController");

    await chatController.joinAnonymousChat(req, res, next);
  }
);

/**
 * @swagger
 * /chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     description: Retrieve all messages from a specific conversation. No authentication required for guests to access their own conversations.
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of messages to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           messageId:
 *                             type: string
 *                             format: uuid
 *                           content:
 *                             type: string
 *                             example: "Tôi muốn hỏi về chính sách bảo hành"
 *                           senderId:
 *                             type: string
 *                             format: uuid
 *                           senderType:
 *                             type: string
 *                             enum: [guest, staff]
 *                             example: "guest"
 *                           senderName:
 *                             type: string
 *                             example: "Nguyễn Văn A"
 *                           sentAt:
 *                             type: string
 *                             format: date-time
 *                           isRead:
 *                             type: boolean
 *                             example: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         limit:
 *                           type: integer
 *                           example: 50
 *                         offset:
 *                           type: integer
 *                           example: 0
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Conversation not found"
 */
router.get(
  "/conversations/:conversationId/messages",
  async (req, res, next) => {
    const chatController = req.container.resolve("chatController");

    await chatController.getMessages(req, res, next);
  }
);

/**
 * @swagger
 * /chat/my-conversations:
 *   get:
 *     summary: Get all conversations for authenticated user
 *     description: Retrieve all conversations that the authenticated staff member is participating in
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, closed]
 *         description: Filter conversations by status
 *         example: "active"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of conversations to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of conversations to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           conversationId:
 *                             type: string
 *                             format: uuid
 *                           guest:
 *                             type: object
 *                             properties:
 *                               guestId:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                                 example: "Nguyễn Văn A"
 *                           status:
 *                             type: string
 *                             enum: [waiting, active, closed]
 *                             example: "active"
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               content:
 *                                 type: string
 *                                 example: "Cảm ơn bạn đã hỗ trợ"
 *                               sentAt:
 *                                 type: string
 *                                 format: date-time
 *                           unreadCount:
 *                             type: integer
 *                             example: 3
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 15
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         offset:
 *                           type: integer
 *                           example: 0
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 */
router.get("/my-conversations", authentication, async (req, res, next) => {
  const chatController = req.container.resolve("chatController");

  await chatController.getMyConversations(req, res, next);
});

/**
 * @swagger
 * /chat/conversations/{conversationId}/close:
 *   patch:
 *     summary: Close a conversation
 *     description: Close an active conversation. Only staff members who are part of the conversation can close it.
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID to close
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Conversation closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         conversationId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "closed"
 *                         closedAt:
 *                           type: string
 *                           format: date-time
 *                         closedBy:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Bad request - Conversation already closed or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Conversation is already closed"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not part of this conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to close this conversation"
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Conversation not found"
 */
router.patch(
  "/conversations/:conversationId/close",
  authentication,
  async (req, res, next) => {
    const chatController = req.container.resolve("chatController");

    await chatController.closeConversation(req, res, next);
  }
);

export default router;
