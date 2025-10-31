import Joi from "joi";

export const getComponentReservationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid("RESERVED", "PICKED_UP", "INSTALLED", "RETURNED", "CANCELLED")
    .default("RESERVED"),
  warehouseId: Joi.string().uuid().optional(),
  typeComponentId: Joi.string().uuid().optional(),
  caseLineId: Joi.string().uuid().optional(),
  guaranteeCaseId: Joi.string().uuid().optional(),
  vehicleProcessingRecordId: Joi.string().uuid().optional(),
  repairTechId: Joi.string().uuid().optional(),
  repairTechPhone: Joi.string().trim().optional(),
  sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

export const pickupReservedComponentSchema = Joi.object({
  reservationIds: Joi.array()
    .items(Joi.string().uuid({ version: "uuidv4" }))
    .min(1)
    .required(),
  pickedUpByTechId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const returnReservedComponentSchema = Joi.object({
  serialNumber: Joi.string().required(),
});
