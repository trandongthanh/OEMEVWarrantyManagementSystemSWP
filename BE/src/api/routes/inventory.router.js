import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

const router = express.Router();

router.get(
  "/summary",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.getInventorySummary(req, res, next);
  }
);

router.get(
  "/type-components",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.getInventoryTypeComponents(req, res, next);
  }
);

export default router;
