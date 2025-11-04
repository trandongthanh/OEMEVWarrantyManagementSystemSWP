import { Router } from "express";
import { makeInvoker } from "awilix-express";
import ServiceCenterController from "../controller/serviceCenter.controller.js";
import { validate } from "../middleware/index.js";
import updateServiceCenterWorkloadSchema from "../../validators/updateServiceCenterWorkload.validator.js";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = Router();
const api = makeInvoker(ServiceCenterController);

/**
 * @swagger
 * /service-centers/{serviceCenterId}/workload-config:
 *   get:
 *     summary: Get the max active tasks per technician for a service center
 *     tags: [Service Centers]
 *     parameters:
 *       - in: path
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the service center
 *     responses:
 *       200:
 *         description: Successfully retrieved the workload configuration
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
 *                     maxActiveTasksPerTechnician:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:serviceCenterId/workload-config",
  authentication,
  authorizationByRole(["service_center_manager", "emv_admin"]),
  api("getWorkloadConfig")
);

/**
 * @swagger
 * /service-centers/{serviceCenterId}/workload-config:
 *   patch:
 *     summary: Update the max active tasks per technician for a service center
 *     tags: [Service Centers]
 *     parameters:
 *       - in: path
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the service center
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxActiveTasksPerTechnician:
 *                 type: integer
 *                 example: 15
 *             required:
 *               - maxActiveTasksPerTechnician
 *     responses:
 *       200:
 *         description: Successfully updated the workload configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Max active tasks per technician updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceCenter:
 *                       $ref: '#/components/schemas/ServiceCenter'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  "/:serviceCenterId/workload-config",
  authentication,
  authorizationByRole(["service_center_manager", "emv_admin"]),
  validate(updateServiceCenterWorkloadSchema),
  api("updateMaxActiveTasksPerTechnician")
);

export default router;
