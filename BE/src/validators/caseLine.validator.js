import Joi from "joi";

export const caseLineSchema = Joi.object({
  diagnosisText: Joi.string().required(),
  correctionText: Joi.string().required(),
  typeComponentId: Joi.string().uuid().allow(null),
  quantity: Joi.number().integer().min(0).required(),
  warrantyStatus: Joi.string().valid("ELIGIBLE", "INELIGIBLE").required(),
  rejectionReason: Joi.string().allow(null).optional(),
});

export const createCaseLinesSchema = Joi.object({
  caselines: Joi.array().items(caseLineSchema).min(1).required(),
});

const approveCaseline = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const approveCaselineBodySchema = Joi.object({
  approvedCaseLineIds: Joi.array().items(approveCaseline).required(),
  rejectedCaseLineIds: Joi.array().items(approveCaseline).required(),
});

export const allocateStockParamsSchema = Joi.object({
  caseId: Joi.string().uuid({ version: "uuidv4" }).required(),
  caselineId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const assignTechnicianParamsSchema = Joi.object({
  caseId: Joi.string().uuid({ version: "uuidv4" }).required(),
  caselineId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const assignTechnicianBodySchema = Joi.object({
  technicianId: Joi.string().uuid().required(),
});

export const updateCaselineParamsSchema = Joi.object({
  caseId: Joi.string().uuid({ version: "uuidv4" }).required(),
  caselineId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const updateCaselineBodySchema = Joi.object({
  diagnosisText: Joi.string().required(),
  correctionText: Joi.string().required(),
  typeComponentId: Joi.string().uuid({ version: "uuidv4" }).allow(null),
  quantity: Joi.number().integer().min(0).required(),
  warrantyStatus: Joi.string().valid("ELIGIBLE", "INELIGIBLE").required(),
  rejectionReason: Joi.string().allow(null).optional(),
});

export const getCaseLineByIdParamsSchema = Joi.object({
  caseId: Joi.string().uuid({ version: "uuidv4" }).required(),
  caselineId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

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
