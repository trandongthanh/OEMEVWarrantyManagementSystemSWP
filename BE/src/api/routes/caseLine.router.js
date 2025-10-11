import express from "express";
import { createCaseLinesSchema } from "../../validators/caseLine.validator.js";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /guarantee-cases/{caseId}/case-lines:
 *   post:
 *     summary: Create case lines for a guarantee case
 *     description: Add one or more case lines (work items/components) to a guarantee case. Only technicians can create case lines.
 *     tags: [Case Line]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guarantee case ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseLines
 *             properties:
 *               caseLines:
 *                 type: array
 *                 description: Array of case line items to create
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - typeComponentId
 *                     - quantity
 *                   properties:
 *                     typeComponentId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the component type to use
 *                       example: "660e8400-e29b-41d4-a716-446655440001"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity of components needed
 *                       example: 2
 *                     description:
 *                       type: string
 *                       description: Additional notes or description for this case line
 *                       example: "Replace worn brake pads"
 *                     laborHours:
 *                       type: number
 *                       minimum: 0
 *                       description: Estimated labor hours for this work
 *                       example: 1.5
 *           examples:
 *             singleComponent:
 *               summary: Single component replacement
 *               value:
 *                 caseLines:
 *                   - typeComponentId: "660e8400-e29b-41d4-a716-446655440001"
 *                     quantity: 1
 *                     description: "Replace battery pack"
 *                     laborHours: 3
 *             multipleComponents:
 *               summary: Multiple components
 *               value:
 *                 caseLines:
 *                   - typeComponentId: "660e8400-e29b-41d4-a716-446655440001"
 *                     quantity: 4
 *                     description: "Replace brake pads"
 *                     laborHours: 1.5
 *                   - typeComponentId: "660e8400-e29b-41d4-a716-446655440002"
 *                     quantity: 2
 *                     description: "Replace brake discs"
 *                     laborHours: 2
 *     responses:
 *       201:
 *         description: Case lines created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Case lines created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseLines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "770e8400-e29b-41d4-a716-446655440003"
 *                           guaranteeCaseId:
 *                             type: string
 *                             format: uuid
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           description:
 *                             type: string
 *                           laborHours:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [pending, in_progress, completed, cancelled]
 *                             example: "pending"
 *                           componentInfo:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                           stockAllocations:
 *                             type: array
 *                             description: Stock allocation details if components were reserved
 *                             items:
 *                               type: object
 *                               properties:
 *                                 stockId:
 *                                   type: string
 *                                 warehouseId:
 *                                   type: string
 *                                 quantity:
 *                                   type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad request - Invalid input data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "caseLines[0].quantity"
 *                       message:
 *                         type: string
 *                         example: "Quantity must be at least 1"
 *       404:
 *         description: Guarantee case not found or component not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Guarantee case not found"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires service_center_technician role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Access denied. Required role: service_center_technician"
 *       409:
 *         description: Conflict - Insufficient stock or component already assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Insufficient stock available"
 *                 details:
 *                   type: object
 *                   properties:
 *                     requested:
 *                       type: integer
 *                     available:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authentication,
  authorizationByRole(["service_center_technician"]),
  validate(createCaseLinesSchema),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.createCaseLine(req, res, next);
  }
);

export default router;
