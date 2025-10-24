import Joi from "joi";

export const messageSchema = Joi.object({
  conversationId: Joi.string().required().uuid({ version: "uuidv4" }),
  senderId: Joi.string().required(),
  senderType: Joi.string().valid("GUEST", "STAFF").required(),
  content: Joi.string().min(1).max(1000).required(),
});
