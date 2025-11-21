import Joi from "joi";

export const updateCustomerSchema = Joi.object({
  fullName: Joi.string().max(100),
  email: Joi.string().email().max(100),
  phone: Joi.string().pattern(/^(?:\+84|0)(?:\d{9}|\d{10})$/),
  address: Joi.string().max(255),
  verificationEmail: Joi.string().email().required(),
}).or("fullName", "email", "phone", "address");
