import Joi from "joi";

export const pickupReservedComponentSchema = Joi.object({
  pickedUpByTechId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const returnReservedComponentSchema = Joi.object({
  serialNumber: Joi.string().required(),
});
