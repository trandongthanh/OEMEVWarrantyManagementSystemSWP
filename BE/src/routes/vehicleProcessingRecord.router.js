import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  canAssignTask,
} from "../../middleware/index.js";

import express from "express";
const router = express.Router();

router.post(
  "/",
  authentication,
  authorizationByRole(["service_center_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.createRecord(req, res, next);
  }
);

router.get(
  "/:id/compatible-components",
  authentication,
  authorizationByRole([
    "service_center_technician",
    "service_center_manager",
    "service_center_staff",
  ]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.searchCompatibleComponentsInStock(
      req,
      res,
      next
    );
  }
);

router.patch(
  "/:id/assign-technician",
  authentication,
  canAssignTask,
  async (req, res, next) => {
    const vehicleProcessingRecordController = await req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.updateMainTechnician(
      req,
      res,
      next
    );
  }
);

router.get(
  "/:id",
  authentication,
  authorizationByRole(["service_center_staff", "service_center_technician"]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.findByIdWithDetails(req, res, next);
  }
);

export default router;
