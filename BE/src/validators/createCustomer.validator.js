import Joi from "joi";

const createCustomerSchema = Joi.object({
  fullName: Joi.string().max(100).required(),
  email: Joi.string().email().max(100).required(),
  phone: Joi.string()
    .pattern(/^(?:\+84|0)(?:\d{9}|\d{10})$/)
    .required(),
  address: Joi.string().max(255).required(),
});

export default createCustomerSchema;
