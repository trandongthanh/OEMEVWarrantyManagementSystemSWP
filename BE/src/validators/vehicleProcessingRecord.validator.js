import Joi from "joi";

const guaranteeCaseSchema = Joi.object({
  contentGuarantee: Joi.string().required(),
});

export const createRecordSchema = Joi.object({
  odometer: Joi.number().required().min(0),
  guaranteeCases: Joi.array().items(guaranteeCaseSchema).required(),
  visitorInfo: Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .required()
      .pattern(/^(?:\+84|0)(?:\d{9}|\d{10})$/)
      .required(),
    relationship: Joi.string().optional(),
    note: Joi.string().optional(),
  }).required(),
  vin: Joi.string().required(),
});

export const updateMainTechnicianBodySchema = Joi.object({
  technicianId: Joi.string().required().uuid({ version: "uuidv4" }),
});

export const updateMainTechnicianParamsSchema = Joi.object({
  id: Joi.string().required().uuid({ version: "uuidv4" }),
});
