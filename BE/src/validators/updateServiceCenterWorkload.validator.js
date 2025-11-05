import Joi from 'joi';

const updateServiceCenterWorkloadSchema = Joi.object({
  maxActiveTasksPerTechnician: Joi.number()
    .integer()
    .min(1)
    .required(),
});

export default updateServiceCenterWorkloadSchema;
