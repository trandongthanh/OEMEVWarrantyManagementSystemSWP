import Joi from "joi";

export const updateCustomerSchema = Joi.object({
  fullName: Joi.string().max(100).required().optional(),
  email: Joi.string().email().max(100).required().optional(),
  phone: Joi.string()
    .pattern(/^(?:\+84|0)(?:\d{9}|\d{10})$/)
    .optional(),

  address: Joi.string().max(255).optional(),
});
