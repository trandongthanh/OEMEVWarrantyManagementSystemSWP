import express from "express";
import caselineRouter from "./caseLine.router.js";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

// router.get("/:id", (req, res) => {
//     const
// });

/**
 * @swagger
 * /guarantee-cases/{caseId}:
 *   post:
 *     summary: Bulk update stock quantities for case lines
 *     description: Update stock quantities for multiple case lines in a guarantee case. This endpoint processes component reservations and stock allocations.
 *     tags: [Guarantee Case]
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
 *         example: "110f907d-009d-441f-88ad-f9522ae44d0d"
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
 *                 description: Array of case lines with quantity updates
 *                 items:
 *                   type: object
 *                   required:
 *                     - caseLineId
 *                     - quantityReserved
 *                   properties:
 *                     caseLineId:
 *                       type: string
 *                       format: uuid
 *                       description: Case line ID
 *                       example: "770e8400-e29b-41d4-a716-446655440003"
 *                     quantityReserved:
 *                       type: integer
 *                       minimum: 0
 *                       description: Quantity to reserve from stock
 *                       example: 2
 *     responses:
 *       200:
 *         description: Stock quantities updated successfully
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
 *                   example: "Stock quantities updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCaseLines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           caseLineId:
 *                             type: string
 *                             format: uuid
 *                           quantityReserved:
 *                             type: integer
 *                           previousQuantity:
 *                             type: integer
 *       400:
 *         description: Bad request - Invalid quantities or insufficient stock
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
 *                   example: "Insufficient stock for component"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service center staff/manager/technician role
 *       404:
 *         description: Guarantee case or case lines not found
 */
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
