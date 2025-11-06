import Joi from "joi";

const registerInServiceCenterSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/)
    .message(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    )
    .required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^(?:\+84|0)(?:\d{9}|\d{10})$/)
    .message("Phone number must be a valid Vietnamese phone number")
    .required(),
  name: Joi.string().trim().min(2).max(100).required(),
  address: Joi.string().trim().min(10).max(500).required(),
  roleId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export default registerInServiceCenterSchema;
