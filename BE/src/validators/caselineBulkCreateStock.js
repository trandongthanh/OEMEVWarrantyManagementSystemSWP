import Joi from "joi";

const caseline = Joi.object({
  caselineId: Joi.string().uuid().required(),
  componentId: Joi.string().uuid().allow(null),
  quantity: Joi.number().integer().min(0).required(),
  status: Joi.string().valid("PENDING_MANAGER_APPROVAL").required(),
});

export const caselineBulkCreateStockSchema = Joi.object({
  caselines: Joi.array().items(caseline).min(1).required(),
});
