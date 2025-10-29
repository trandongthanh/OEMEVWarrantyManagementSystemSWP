import dayjs from "dayjs";
import Joi from "joi";

const stockTransferRequestItemSchema = Joi.object({
  typeComponentId: Joi.string().uuid().required(),
  quantityRequested: Joi.number().integer().min(1).required(),
  caselineId: Joi.string().uuid().required(),
});

export const stockTransferRequestSchema = Joi.object({
  requestingWarehouseId: Joi.string().uuid().required(),
  items: Joi.array().items(stockTransferRequestItemSchema).min(1).required(),
});

export const stockTransferRequestShipBodySchema = Joi.object({
  estimatedDeliveryDate: Joi.date().max(dayjs()).required(),
});
