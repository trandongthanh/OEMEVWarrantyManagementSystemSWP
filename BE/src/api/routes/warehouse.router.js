import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /warehouse:
 *   get:
 *     summary: Get warehouse information and stock levels
 *     tags: [Warehouse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleCompanyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle company ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: componentType
 *         schema:
 *           type: string
 *         description: Filter by component type
 *         example: "engine"
 *       - in: query
 *         name: minStock
 *         schema:
 *           type: integer
 *         description: Minimum stock level filter
 *         example: 10
 *     responses:
 *       200:
 *         description: Warehouse information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     warehouses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           warehouseId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Main Warehouse"
 *                           location:
 *                             type: string
 *                             example: "Ho Chi Minh City"
 *                           vehicleCompanyId:
 *                             type: string
 *                             format: uuid
 *                           stock:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 typeComponentId:
 *                                   type: string
 *                                   format: uuid
 *                                 quantity:
 *                                   type: integer
 *                                 component:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                     price:
 *                                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authentication,
  authorizationByRole([
    "service_center_manager",
    "parts_coordinator_service_center",
    "parts_coordinator_company",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const warehouseController = req.container.resolve("warehouseController");

    await warehouseController.getAllWarehouse(req, res, next);
  }
);

export default router;
