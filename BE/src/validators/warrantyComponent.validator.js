import Joi from "joi";
import {
  HIGH_VOLTAGE_BATTERY,
  POWERTRAIN,
  CHARGING_SYSTEM,
  THERMAL_MANAGEMENT,
  LOW_VOLTAGE_SYSTEM,
  BRAKING,
  SUSPENSION_STEERING,
  HVAC,
  BODY_CHASSIS,
  INFOTAINMENT_ADAS,
} from "../constants/typeComponentCategory.js";

const existingTypeComponentSchema = Joi.object({
  typeComponentId: Joi.string().uuid().required(),
  durationMonth: Joi.number().integer().min(0).required(),
  mileageLimit: Joi.number().integer().min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
});

const newTypeComponentSchema = Joi.object({
  sku: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  price: Joi.number().positive().required(),
  category: Joi.string()
    .valid(
      HIGH_VOLTAGE_BATTERY,
      POWERTRAIN,
      CHARGING_SYSTEM,
      THERMAL_MANAGEMENT,
      LOW_VOLTAGE_SYSTEM,
      BRAKING,
      SUSPENSION_STEERING,
      HVAC,
      BODY_CHASSIS,
      INFOTAINMENT_ADAS
    )
    .required(),
  makeBrand: Joi.string().trim().allow(null, ""),
  durationMonth: Joi.number().integer().min(0).required(),
  mileageLimit: Joi.number().integer().min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
});

const createWarrantyComponentsBodySchema = Joi.object({
  typeComponentWarrantyList: Joi.array()
    .items(
      Joi.alternatives().try(
        existingTypeComponentSchema,
        newTypeComponentSchema
      )
    )
    .min(1)
    .required(),
});

const createWarrantyComponentsParamsSchema = Joi.object({
  vehicleModelId: Joi.string().uuid().required(),
});

export {
  createWarrantyComponentsBodySchema,
  createWarrantyComponentsParamsSchema,
};

export default createWarrantyComponentsBodySchema;
