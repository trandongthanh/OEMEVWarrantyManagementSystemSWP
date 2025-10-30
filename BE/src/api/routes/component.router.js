import express from "express";
import { authentication } from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /components/{componentId}/status:
 *   patch:
 *     summary: Update component status
 *     description: Update the status of a component (e.g., IN_STOCK, RESERVED, INSTALLED, RETURNED, DEFECTIVE)
 *     tags: [Components]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Component ID
 *         example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_STOCK, RESERVED, INSTALLED, RETURNED, DEFECTIVE]
 *                 description: New status for the component
 *                 example: "DEFECTIVE"
 *     responses:
 *       200:
 *         description: Component status updated successfully
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
 *                     component:
 *                       type: object
 *                       properties:
 *                         componentId:
 *                           type: string
 *                           format: uuid
 *                         serialNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: "DEFECTIVE"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Component not found
 */
router.patch("/:componentId/status", authentication, async (req, res, next) => {
  const componentController = req.container.resolve("componentController");

  return componentController.updateStatus(req, res, next);
});

export default router;
