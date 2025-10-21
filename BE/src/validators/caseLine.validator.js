import Joi from "joi";

const caseLineSchema = Joi.object({
  diagnosisText: Joi.string().required(),
  correctionText: Joi.string().required(),
  componentId: Joi.string().uuid().allow(null),
  quantity: Joi.number().integer().min(0).required(),
  warrantyStatus: Joi.string().valid("ELIGIBLE", "INELIGIBLE").required(),
});

export const createCaseLinesSchema = Joi.object({
  caselines: Joi.array().items(caseLineSchema).min(1).required(),
});

// Validator for approving a caseline
export const approveCaselineParamsSchema = Joi.object({
  caselineId: Joi.string().uuid().required(),
});

// Validator for allocating stock
export const allocateStockParamsSchema = Joi.object({
  caselineId: Joi.string().uuid().required(),
});

// Validator for assigning technician
export const assignTechnicianParamsSchema = Joi.object({
  caselineId: Joi.string().uuid().required(),
});

export const assignTechnicianBodySchema = Joi.object({
  technicianId: Joi.string().uuid().required(),
});

// Validator for pickup components
export const pickupComponentsParamsSchema = Joi.object({
  caselineId: Joi.string().uuid().required(),
});

// Validator for install components
export const installComponentsParamsSchema = Joi.object({
  caselineId: Joi.string().uuid().required(),
});

// Validator for get caseline by ID
export const getCaselineByIdParamsSchema = Joi.object({
  caselineId: Joi.string().uuid().required(),
});

// Validator for list caselines
export const getAllCaselinesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid(
      "PENDING",
      "CUSTOMER_APPROVED",
      "READY_FOR_REPAIR",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    )
    .optional(),
  guaranteeCaseId: Joi.string().uuid().optional(),
});
