import Joi from "joi";

const caseLineSchema = Joi.object({
  diagnosisText: Joi.string().required(),
  correctionText: Joi.string().required(),
  componentId: Joi.string().uuid().allow(null),
  quantity: Joi.number().integer().min(0).required(),
});

export const createCaseLinesSchema = Joi.object({
  caselines: Joi.array().items(caseLineSchema).min(1).required(),
});
