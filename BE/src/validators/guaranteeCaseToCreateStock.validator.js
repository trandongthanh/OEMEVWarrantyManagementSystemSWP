import Joi from "joi";

const guaranteeCaseToCreateStockValidator = Joi.object({
  status: Joi.string().valid("DIAGNOSED").required(),
});

export default guaranteeCaseToCreateStockValidator;
