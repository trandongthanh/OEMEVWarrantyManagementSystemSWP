export const createVehicleModelSchema = Joi.object({
  vehicleModelName: Joi.string().trim().required(),
  yearOfLaunch: Joi.date().iso().required(),
  placeOfManufacture: Joi.string().trim().required(),
  generalWarrantyDuration: Joi.number().integer().min(0).optional(),
  generalWarrantyMileage: Joi.number().integer().min(0).optional(),
  components: Joi.array()
    .items(
      Joi.object({
        typeComponentId: Joi.string().uuid().optional(),
        newTypeComponent: Joi.object({
          name: Joi.string().required(),
          price: Joi.number().positive().required(),
          sku: Joi.string().required(),
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
        }).optional(),
        quantity: Joi.number().integer().min(1).required(),
        durationMonth: Joi.number().integer().min(0).optional(),
        mileageLimit: Joi.number().integer().min(0).optional(),
      }).xor("typeComponentId", "newTypeComponent")
    )
    .min(1)
    .required(),
});
