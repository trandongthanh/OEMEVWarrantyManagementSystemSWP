import Joi from "joi";

const createVehicleSchema = Joi.object({
  vin: Joi.string().trim().min(17).max(17).required(),
  dateOfManufacture: Joi.date().iso().required(),
  placeOfManufacture: Joi.string().trim().min(2).max(100).required(),
  vehicleModelId: Joi.string().uuid().required(),
  licensePlate: Joi.string().trim().optional().allow(null, ""),
  registerationDate: Joi.date().iso().optional().allow(null),
  ownerId: Joi.string().uuid().optional().allow(null),
  purchaseDate: Joi.date().iso().optional().allow(null),
});

export default createVehicleSchema;
