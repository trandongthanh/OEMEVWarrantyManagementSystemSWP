import Joi from "joi";

const createOemVehicleModelSchema = Joi.object({
  vehicleModelName: Joi.string().min(3).max(100).required(),
  yearOfLaunch: Joi.date().iso().required(),
  placeOfManufacture: Joi.string().min(2).max(100).required(),
  generalWarrantyDuration: Joi.number().integer().min(0).required(),
  generalWarrantyMileage: Joi.number().integer().min(0).required(),
});

export default createOemVehicleModelSchema;
