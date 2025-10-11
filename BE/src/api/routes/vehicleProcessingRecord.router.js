import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  canAssignTask,
} from "../middleware/index.js";

import express from "express";
const router = express.Router();

/**
 * @swagger
 * /vehicle-processing-record:
 *   post:
 *     summary: Create a new vehicle processing record
 *     tags: [Vehicle Processing Record]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *               - issueDescription
 *             properties:
 *               vin:
 *                 type: string
 *                 description: Vehicle Identification Number
 *                 example: "011HFDVNVUV302569"
 *               issueDescription:
 *                 type: string
 *                 description: Description of the vehicle issue
 *                 example: "Engine making unusual noise"
 *               mileage:
 *                 type: integer
 *                 description: Current vehicle mileage
 *                 example: 50000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Priority level of the record
 *                 example: "medium"
 *     responses:
 *       201:
 *         description: Vehicle processing record created successfully
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
 *                     record:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         vin:
 *                           type: string
 *                         issueDescription:
 *                           type: string
 *                         mileage:
 *                           type: integer
 *                         priority:
 *                           type: string
 *                         status:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service_center_staff role
 *       404:
 *         description: Vehicle not found
 */
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

/**
 * @swagger
 * /vehicle-processing-record/{id}/assignmen:
 *   patch:
 *     summary: Assign a technician to a vehicle processing record
 *     tags: [Vehicle Processing Record]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle processing record ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - technicianId
 *             properties:
 *               technicianId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the technician to assign
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Technician assigned successfully
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
 *                     record:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         assignedTechnicianId:
 *                           type: string
 *                           format: uuid
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid technician ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions or invalid assignment
 *       404:
 *         description: Record or technician not found
 */
router.patch(
  "/:id/assignment",
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

/**
 * @swagger
 * /vehicle-processing-record/{id}:
 *   get:
 *     summary: Get vehicle processing record details by ID
 *     tags: [Vehicle Processing Record]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle processing record ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Vehicle processing record found successfully
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
 *                     record:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         vin:
 *                           type: string
 *                         issueDescription:
 *                           type: string
 *                         mileage:
 *                           type: integer
 *                         priority:
 *                           type: string
 *                         status:
 *                           type: string
 *                         assignedTechnicianId:
 *                           type: string
 *                           format: uuid
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                         vehicle:
 *                           type: object
 *                           properties:
 *                             vin:
 *                               type: string
 *                             model:
 *                               type: object
 *                             owner:
 *                               type: object
 *                         assignedTechnician:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: string
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *       404:
 *         description: Processing record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  "/:id",
  authentication,
  authorizationByRole([
    "service_center_staff",
    "service_center_technician",
    "service_center_manager",
  ]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.findById(req, res, next);
  }
);

// router.get("/processing-records");

/**
 * @swagger
 * /vehicle-processing-record/{id}/compatible-components:
 *   get:
 *     summary: Search compatible components in stock for a processing record
 *     tags: [Vehicle Processing Record]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle processing record ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: componentType
 *         schema:
 *           type: string
 *         description: Filter by component type
 *         example: "engine"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Compatible components found successfully
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
 *                     components:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           availableStock:
 *                             type: integer
 *                           warehouseLocation:
 *                             type: string
 *       404:
 *         description: Processing record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
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

export default router;
