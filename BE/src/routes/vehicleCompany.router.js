const express = require("express");
const VehicleCompanyController = require("../controller/vehicleCompany.controller");

const router = express.Router();

router.get("/", VehicleCompanyController.findAllCompaniesWithModels);

router.post("/", VehicleCompanyController.createVehicleCompany);

module.exports = router;
