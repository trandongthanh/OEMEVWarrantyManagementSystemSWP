const express = require("express");

const VehicleController = require("../controller/vehicle.controller");
const {
  authencationWithJwtToken,
  authorizeWithRole,
} = require("../../middleware");

const router = express.Router();

router.use(authencationWithJwtToken, authorizeWithRole(["staff"]));

router.post("/find-vehicle-by-vin", VehicleController.findVehicleByVin);
router.post("/:vin", VehicleController.registerVehicleWithCustomer);

module.exports = router;
