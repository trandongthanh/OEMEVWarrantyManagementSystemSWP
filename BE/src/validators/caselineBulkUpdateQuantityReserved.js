import Joi from "joi";

const caseline = Joi.object({
  caselineId: Joi.string().uuid().required(),
  typecomponentId: Joi.string().uuid().allow(null),
  quantity: Joi.number().integer().min(0).required(),
  status: Joi.string().valid("CUSTOMER_APPROVED").required(),
});

export default caseline;
