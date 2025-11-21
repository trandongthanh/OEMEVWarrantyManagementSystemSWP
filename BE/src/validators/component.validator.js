import Joi from "joi";

const createComponentSchema = Joi.object({
  typeComponentId: Joi.string().uuid().required(),
  warehouseId: Joi.string().uuid().required(),
  serialNumber: Joi.string().trim().max(100).required(),
  status: Joi.string().valid("IN_WAREHOUSE").default("IN_WAREHOUSE"),
});

export default createComponentSchema;
