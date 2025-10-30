import Joi from "joi";

export const sendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  vin: Joi.string().length(17).required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required(),
});
