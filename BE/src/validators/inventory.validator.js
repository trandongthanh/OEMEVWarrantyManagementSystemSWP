import Joi from "joi";

export const createInventoryAdjustmentBodySchema = Joi.object({
  stockId: Joi.string().uuid().required(),
  adjustmentType: Joi.string().valid("IN", "OUT").required(),
  quantity: Joi.number().integer().min(1).required(),
  reason: Joi.string().required(),
  note: Joi.string().allow(null, "").optional(),
});

export const createInventoryAdjustmentQuerySchema = Joi.object({
  adjustedByUserId: Joi.string().uuid().required(),
});
