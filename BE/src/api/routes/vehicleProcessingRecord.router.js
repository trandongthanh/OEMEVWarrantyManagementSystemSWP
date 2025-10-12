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
 *     description: Create a new vehicle processing record with one or more guarantee cases
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
 *               - odometer
 *               - guaranteeCases
 *             properties:
 *               vin:
 *                 type: string
 *                 description: Vehicle Identification Number
 *                 example: "VIN-NEW-0"
 *               odometer:
 *                 type: number
 *                 minimum: 0
 *                 description: Current vehicle odometer reading
 *                 example: 52340
 *               guaranteeCases:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of guarantee cases (at least one is required)
 *                 items:
 *                   type: object
 *                   required:
 *                     - contentGuarantee
 *                   properties:
 *                     contentGuarantee:
 *                       type: string
 *                       description: Description of the issue or guarantee case
 *                       example: "Xe bị rung nhẹ khi tăng tốc, cần kiểm tra hệ thống truyền động."
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
 *                         vin:
 *                           type: string
 *                           example: "VIN-NEW-0"
 *                         checkInDate:
 *                           type: string
 *                           format: date-time
 *                           description: Date and time when vehicle checked in
 *                           example: "2025-10-11T15:36:25.000Z"
 *                         odometer:
 *                           type: number
 *                           description: Vehicle odometer reading at check-in
 *                           example: 52340
 *                         status:
 *                           type: string
 *                           description: Current status of the processing record
 *                           example: "processing"
 *                         mainTechnician:
 *                           type: object
 *                           nullable: true
 *                           description: Main technician assigned to this record (if assigned)
 *                           properties:
 *                             userId:
 *                               type: string
 *                               format: uuid
 *                               example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                             name:
 *                               type: string
 *                               example: "KTV Dương Giao Linh"
 *                         vehicle:
 *                           type: object
 *                           description: Vehicle information
 *                           properties:
 *                             vin:
 *                               type: string
 *                               example: "VIN-NEW-0"
 *                             model:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "VF 9 Plus"
 *                                 vehicleModelId:
 *                                   type: string
 *                                   format: uuid
 *                                   example: "74b79531-887e-4cb6-a4c8-e2e36fce4b2b"
 *                         guaranteeCases:
 *                           type: array
 *                           description: List of guarantee cases created for this record
 *                           items:
 *                             type: object
 *                             properties:
 *                               guaranteeCaseId:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                               status:
 *                                 type: string
 *                                 description: Status of the guarantee case
 *                                 example: "pending_diagnosis"
 *                               contentGuarantee:
 *                                 type: string
 *                                 description: Description of the issue
 *                                 example: "Đèn pha bên trái sáng yếu, cần kiểm tra hệ thống điện."
 *                         createdByStaff:
 *                           type: object
 *                           description: Staff member who created this record
 *                           properties:
 *                             userId:
 *                               type: string
 *                               format: uuid
 *                               example: "82af4858-9298-489f-9f97-9af0cbab68e4"
 *                             name:
 *                               type: string
 *                               example: "SA Tô Mỹ Lệ"
 *       400:
 *         description: Bad request - Invalid input data
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
 *                   example: "At least one guarantee case is required."
 *       401:
 *         description: Unauthorized
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
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - requires service_center_staff role
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
 *                   example: "Access denied. Required role: service_center_staff"
 *       404:
 *         description: Vehicle not found or vehicle doesn't have owner
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
 *                   example: "Vehicle with VIN-NEW-0 does not have an owner, cannot create a record"
 *       409:
 *         description: Conflict - Vehicle already has an active record
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
 *                   example: "Vehicle already has an active record"
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
 *     description: Retrieve detailed information about a vehicle processing record including vehicle, technician, and guarantee cases
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
 *                         vin:
 *                           type: string
 *                           description: Vehicle Identification Number
 *                           example: "VIN-NEW-0"
 *                         checkInDate:
 *                           type: string
 *                           format: date-time
 *                           description: Date and time when vehicle checked in
 *                           example: "2025-10-11T15:36:25.000Z"
 *                         odometer:
 *                           type: number
 *                           description: Vehicle odometer reading at check-in
 *                           example: 52340
 *                         status:
 *                           type: string
 *                           description: Current status of the processing record
 *                           example: "processing"
 *                           enum: [pending, processing, completed]
 *                         mainTechnician:
 *                           type: object
 *                           nullable: true
 *                           description: Main technician assigned to this record
 *                           properties:
 *                             userId:
 *                               type: string
 *                               format: uuid
 *                               example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                             name:
 *                               type: string
 *                               example: "KTV Dương Giao Linh"
 *                         vehicle:
 *                           type: object
 *                           description: Vehicle information
 *                           properties:
 *                             vin:
 *                               type: string
 *                               example: "VIN-NEW-0"
 *                             model:
 *                               type: object
 *                               description: Vehicle model details
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "VF 9 Plus"
 *                                 vehicleModelId:
 *                                   type: string
 *                                   format: uuid
 *                                   example: "74b79531-887e-4cb6-a4c8-e2e36fce4b2b"
 *                         guaranteeCases:
 *                           type: array
 *                           description: List of guarantee cases for this record
 *                           items:
 *                             type: object
 *                             properties:
 *                               guaranteeCaseId:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                               status:
 *                                 type: string
 *                                 description: Status of the guarantee case
 *                                 example: "pending_diagnosis"
 *                               contentGuarantee:
 *                                 type: string
 *                                 description: Description of the issue
 *                                 example: "Đèn pha bên trái sáng yếu, cần kiểm tra hệ thống điện."
 *                         createdByStaff:
 *                           type: object
 *                           description: Staff member who created this record
 *                           properties:
 *                             userId:
 *                               type: string
 *                               format: uuid
 *                               example: "82af4858-9298-489f-9f97-9af0cbab68e4"
 *                             name:
 *                               type: string
 *                               example: "SA Tô Mỹ Lệ"
 *       400:
 *         description: Bad request - Invalid record ID
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
 *                   example: "RecordId and userId is required"
 *       401:
 *         description: Unauthorized
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
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - insufficient permissions
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
 *                   example: "You do not have permission to view this record"
 *       404:
 *         description: Processing record not found
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
 *                   example: "Processing record not found"
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

/**
 * @swagger
 * /vehicle-processing-record/{id}/compatible-components:
 *   get:
 *     summary: Search compatible components in stock for a processing record
 *     description: Search for compatible vehicle components available in warehouse stock based on the vehicle model in the processing record
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
 *         example: "75977d41-64cc-4b16-8858-8f5f7b53944d"
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Component category to filter by
 *         example: "BRAKING"
 *       - in: query
 *         name: searchName
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by component name (optional)
 *         example: "phanh"
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
 *                     result:
 *                       type: array
 *                       description: List of compatible components available in stock
 *                       items:
 *                         type: object
 *                         properties:
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                             description: Unique identifier of the component type
 *                             example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                           name:
 *                             type: string
 *                             description: Name of the component
 *                             example: "Cảm biến ABS bánh sau"
 *       400:
 *         description: Bad request - Missing required parameters
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
 *                   example: "serviceCenterId, category, vehicleProcessingRecordId, modelId is required"
 *       401:
 *         description: Unauthorized
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
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - insufficient permissions
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
 *                   example: "You do not have permission to view this record"
 *       404:
 *         description: Processing record not found
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
 *                   example: "Processing record not found"
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
