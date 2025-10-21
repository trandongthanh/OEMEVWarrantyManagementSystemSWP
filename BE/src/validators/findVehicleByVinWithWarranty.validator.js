import dayjs from "dayjs";
import Joi from "joi";

export const findVehicleByVinWithWarrantyParamsSchema = Joi.object({
  vin: Joi.string().length(17).required(),
  // vin: Joi.string().required(),
});

export const findVehicleByVinWithWarrantyQuerySchema = Joi.object({
  odometer: Joi.number().min(0).required(),
});

export const findVehicleByVinWithWarrantyPreviewParamsSchema = Joi.object({
  vin: Joi.string().length(17).required(),
  // vin: Joi.string().required(),
});

export const findVehicleByVinWithWarrantyPreviewBodySchema = Joi.object({
  odometer: Joi.number().min(0).required(),

  purchaseDate: Joi.date().max(dayjs()).required(),
});
