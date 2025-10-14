import express from "express";
import caselineRouter from "./caseLine.router.js";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

// router.get("/:id", (req, res) => {
//     const
// });

router.post(
  "/:caseId",
  authentication,
  authorizationByRole([
    "service_center_manager",
    "service_center_staff",
    "service_center_technician",
  ]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.bulkUpdateStockQuantities(
      req,
      res,
      next
    );
  }
);

router.use("/:caseId/case-lines", caselineRouter);

export default router;
