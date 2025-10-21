import Joi from "joi";

const guaranteeCaseToCreateCaseLinesValidator = Joi.object({
  status: Joi.string().valid("PENDING_ASSIGNMENT").required(),
});

export default guaranteeCaseToCreateCaseLinesValidator;
