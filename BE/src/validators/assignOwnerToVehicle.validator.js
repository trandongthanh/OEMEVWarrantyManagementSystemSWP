import dayjs from "dayjs";
import Joi from "joi";

export const assignOwnerToVehicleParamsSchema = Joi.object({
  vin: Joi.string().length(17).required(),
});

export const assignOwnerToVehicleBodySchema = Joi.object({
  customer: Joi.object({
    fullName: Joi.string().max(100).required(),
    email: Joi.string().email().max(100).required(),
    phone: Joi.string()
      .pattern(/^(?:\+84|0)(?:\d{9}|\d{10})$/)
      .required(),
    address: Joi.string().max(255).required(),
  }).optional(),

  customerId: Joi.string().optional().guid({ version: "uuidv4" }),

  dateOfManufacture: Joi.date().max(dayjs()).required(),

  licensePlate: Joi.string().max(20).required(),

  purchaseDate: Joi.date().max(dayjs()).required(),
}).xor("customer", "customerId");
