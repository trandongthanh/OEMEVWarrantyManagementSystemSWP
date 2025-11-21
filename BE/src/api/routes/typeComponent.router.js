import express from "express";
import {
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /type-components:
 *   get:
 *     summary: Get a paginated list of type components
 *     description: Retrieve a list of type components with support for filtering and pagination.
 *     tags: [Type Component]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by type component name (case-insensitive, partial match).
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *         description: Filter by type component SKU (case-insensitive, partial match).
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [HIGH_VOLTAGE_BATTERY, POWERTRAIN, CHARGING_SYSTEM, THERMAL_MANAGEMENT, LOW_VOLTAGE_SYSTEM, BRAKING, SUSPENSION_STEERING, HVAC, BODY_CHASSIS, INFOTAINMENT_ADAS]
 *         description: Filter by type component category.
 *     responses:
 *       200:
 *         description: A paginated list of type components.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           sku:
 *                             type: string
 *                           category:
 *                             type: string
 *                           price:
 *                             type: number
 *                           makeBrand:
 *                              type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  authentication,
  authorizationByRole(["emv_staff", "parts_coordinator_company", "service_center_manager"]),
  async (req, res, next) => {
    const typeComponentController = req.container.resolve(
      "typeComponentController"
    );
    await typeComponentController.getAllTypeComponents(req, res, next);
  }
);

export default router;
