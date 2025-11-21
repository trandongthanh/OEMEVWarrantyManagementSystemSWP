import Joi from "joi";

export const createVehicleModelSchema = Joi.object({
  vehicleModelName: Joi.string().trim().min(3).max(100).required(),
  yearOfLaunch: Joi.date().iso().required(),
  placeOfManufacture: Joi.string().trim().min(2).max(100).required(),
  generalWarrantyDuration: Joi.number().integer().min(0).required(),
  generalWarrantyMileage: Joi.number().integer().min(0).required(),
  companyId: Joi.string().uuid().required(),
  components: Joi.array()
    .items(
      Joi.object({
        typeComponentId: Joi.string().uuid().optional(),
        newTypeComponent: Joi.object({
          name: Joi.string().trim().required(),
          price: Joi.number().positive().required(),
          sku: Joi.string().trim().required(),
          category: Joi.string()
            .valid(
              "HIGH_VOLTAGE_BATTERY",
              "POWERTRAIN",
              "CHARGING_SYSTEM",
              "THERMAL_MANAGEMENT",
              "LOW_VOLTAGE_SYSTEM",
              "BRAKING",
              "SUSPENSION_STEERING",
              "HVAC",
              "BODY_CHASSIS",
              "INFOTAINMENT_ADAS"
            )
            .required(),
          makeBrand: Joi.string().trim().allow(null, ""),
        }).optional(),
        quantity: Joi.number().integer().min(1).required(),
        durationMonth: Joi.number().integer().min(0).optional(),
        mileageLimit: Joi.number().integer().min(0).optional(),
      }).xor("typeComponentId", "newTypeComponent")
    )
    .min(1)
    .required(),
});

export const updateWarrantyComponentSchema = Joi.object({
  quantity: Joi.number().integer().min(1).optional(),
  durationMonth: Joi.number().integer().min(0).optional(),
  mileageLimit: Joi.number().integer().min(0).optional(),
}).min(1);

export const updateWarrantyComponentParamsSchema = Joi.object({
  vehicleModelId: Joi.string().uuid().required(),
  warrantyComponentId: Joi.string().uuid().required(),
});
