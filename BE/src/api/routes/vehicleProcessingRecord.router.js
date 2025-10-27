import { createRecordSchema } from "../../validators/vehicleProcessingRecord.validator.js";
import {
  updateMainTechnicianBodySchema,
  updateMainTechnicianParamsSchema,
} from "../../validators/vehicleProcessingRecord.validator.js";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";

import express from "express";
const router = express.Router();

/**
 * @swagger
 * /processing-records:
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
  validate(createRecordSchema, "body"),

  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.createRecord(req, res, next);
  }
);

router.patch(
  "/:id/completed",
  authentication,
  authorizationByRole(["service_center_staff"]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.completeRecord(req, res, next);
  }
);

/**
 * @swagger
 * /processing-records/{id}/complete-diagnosis:
 *   patch:
 *     summary: Complete diagnosis phase and transition caselines from DRAFT to PENDING_APPROVAL
 *     description: |
 *       This endpoint marks the diagnosis phase as complete. It validates that all caselines are in DRAFT status,
 *       then transitions them to PENDING_APPROVAL. It also updates the GuaranteeCase status to DIAGNOSED
 *       and the VehicleProcessingRecord status to WAITING_CUSTOMER_APPROVAL.
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
 *         description: Diagnosis completed successfully
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
 *                     vehicleProcessingRecordId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: "WAITING_CUSTOMER_APPROVAL"
 *                     guaranteeCases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           guaranteeCaseId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             example: "DIAGNOSED"
 *                           caseLines:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 caseLineId:
 *                                   type: string
 *                                   format: uuid
 *                                 status:
 *                                   type: string
 *                                   example: "PENDING_APPROVAL"
 *       400:
 *         description: Bad request - caselines not in DRAFT status or GuaranteeCase not in IN_DIAGNOSIS
 *       404:
 *         description: Vehicle processing record not found
 *       403:
 *         description: Forbidden - user does not have permission
 */
router.patch(
  "/:id/complete-diagnosis",
  authentication,
  authorizationByRole(["service_center_manager", "service_center_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.completeDiagnosis(req, res, next);
  }
);

/**
 * @swagger
 * /processing-records/{id}/completed:
 *   patch:
 *     summary: Complete a vehicle processing record
 *     description: Mark a vehicle processing record as completed. All case lines must be completed before completing the record. Sets checkOutDate to current time.
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
 *     responses:
 *       200:
 *         description: Vehicle processing record completed successfully
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
 *                     vehicleProcessingRecordId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: "COMPLETED"
 *                     checkOutDate:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Vehicle processing record not found
 *       409:
 *         description: Conflict - not all case lines are completed
 *       403:
 *         description: Forbidden - user does not have permission
 */
router.patch(
  "/:id/completed",
  authentication,
  authorizationByRole(["service_center_manager", "service_center_staff"]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.completeRecord(req, res, next);
  }
);

/**
 * @swagger
 * /processing-records/{id}/assignment:
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
  authorizationByRole(["service_center_manager"]),
  attachCompanyContext,
  validate(updateMainTechnicianParamsSchema, "params"),
  validate(updateMainTechnicianBodySchema, "body"),

  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
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
 * /processing-records/{id}:
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
  attachCompanyContext,

  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.getById(req, res, next);
  }
);

/**
 * @swagger
 * /processing-records/{id}/compatible-components:
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
  attachCompanyContext,
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

/**
 * @swagger
 * /processing-records:
 *   get:
 *     summary: Get all vehicle processing records with pagination
 *     description: Retrieve a paginated list of vehicle processing records. Access is role-based - staff see their own records, technicians see assigned records, managers see all records in their service center.
 *     tags: [Vehicle Processing Record]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CHECKED_IN, IN_DIAGNOSIS, WAITING_FOR_PARTS, PAID, IN_REPAIR, COMPLETED, CANCELLED]
 *         description: Filter records by status (optional)
 *         example: "IN_DIAGNOSIS"
 *     responses:
 *       200:
 *         description: List of vehicle processing records retrieved successfully
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
 *                     records:
 *                       type: object
 *                       properties:
 *                         records:
 *                           type: array
 *                           description: Array of vehicle processing records
 *                           items:
 *                             type: object
 *                             properties:
 *                               vin:
 *                                 type: string
 *                                 description: Vehicle Identification Number
 *                                 example: "VIN-NEW-0"
 *                               checkInDate:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Date and time when vehicle checked in
 *                                 example: "2025-10-11T15:36:25.000Z"
 *                               odometer:
 *                                 type: number
 *                                 description: Vehicle odometer reading at check-in
 *                                 example: 52340
 *                               status:
 *                                 type: string
 *                                 description: Current status of the processing record
 *                                 example: "IN_DIAGNOSIS"
 *                               mainTechnician:
 *                                 type: object
 *                                 nullable: true
 *                                 description: Main technician assigned to this record
 *                                 properties:
 *                                   userId:
 *                                     type: string
 *                                     format: uuid
 *                                     example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                                   name:
 *                                     type: string
 *                                     example: "KTV Dương Giao Linh"
 *                               vehicle:
 *                                 type: object
 *                                 description: Vehicle information
 *                                 properties:
 *                                   vin:
 *                                     type: string
 *                                     example: "VIN-NEW-0"
 *                                   model:
 *                                     type: object
 *                                     properties:
 *                                       name:
 *                                         type: string
 *                                         example: "VF 9 Plus"
 *                                       vehicleModelId:
 *                                         type: string
 *                                         format: uuid
 *                                         example: "74b79531-887e-4cb6-a4c8-e2e36fce4b2b"
 *                               guaranteeCases:
 *                                 type: array
 *                                 description: List of guarantee cases for this record
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     guaranteeCaseId:
 *                                       type: string
 *                                       format: uuid
 *                                       example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                                     status:
 *                                       type: string
 *                                       example: "pending_diagnosis"
 *                                     contentGuarantee:
 *                                       type: string
 *                                       example: "Đèn pha bên trái sáng yếu, cần kiểm tra hệ thống điện."
 *                               createdByStaff:
 *                                 type: object
 *                                 description: Staff member who created this record
 *                                 properties:
 *                                   userId:
 *                                     type: string
 *                                     format: uuid
 *                                     example: "82af4858-9298-489f-9f97-9af0cbab68e4"
 *                                   name:
 *                                     type: string
 *                                     example: "SA Tô Mỹ Lệ"
 *                         recordsCount:
 *                           type: integer
 *                           description: Total number of records returned in current page
 *                           example: 10
 *             examples:
 *               managerView:
 *                 summary: Manager viewing all records
 *                 value:
 *                   status: "success"
 *                   data:
 *                     records:
 *                       records:
 *                         - vin: "VIN-NEW-0"
 *                           checkInDate: "2025-10-11T15:36:25.000Z"
 *                           odometer: 52340
 *                           status: "IN_DIAGNOSIS"
 *                           mainTechnician:
 *                             userId: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                             name: "KTV Dương Giao Linh"
 *                           vehicle:
 *                             vin: "VIN-NEW-0"
 *                             model:
 *                               name: "VF 9 Plus"
 *                               vehicleModelId: "74b79531-887e-4cb6-a4c8-e2e36fce4b2b"
 *                           guaranteeCases:
 *                             - guaranteeCaseId: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                               status: "pending_diagnosis"
 *                               contentGuarantee: "Đèn pha bên trái sáng yếu"
 *                           createdByStaff:
 *                             userId: "82af4858-9298-489f-9f97-9af0cbab68e4"
 *                             name: "SA Tô Mỹ Lệ"
 *                       recordsCount: 1
 *               technicianView:
 *                 summary: Technician viewing assigned records
 *                 value:
 *                   status: "success"
 *                   data:
 *                     records:
 *                       records:
 *                         - vin: "VIN-NEW-1"
 *                           checkInDate: "2025-10-12T09:20:00.000Z"
 *                           odometer: 45000
 *                           status: "IN_REPAIR"
 *                           mainTechnician:
 *                             userId: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                             name: "KTV Dương Giao Linh"
 *                           vehicle:
 *                             vin: "VIN-NEW-1"
 *                             model:
 *                               name: "VF 8 Plus"
 *                               vehicleModelId: "84b79531-887e-4cb6-a4c8-e2e36fce4b3c"
 *                           guaranteeCases:
 *                             - guaranteeCaseId: "220f907d-009d-441f-88ad-f9522ae44d1e"
 *                               status: "in_progress"
 *                               contentGuarantee: "Thay thế pin cao áp"
 *                           createdByStaff:
 *                             userId: "92af4858-9298-489f-9f97-9af0cbab68f5"
 *                             name: "SA Nguyễn Văn B"
 *                       recordsCount: 1
 *               emptyResult:
 *                 summary: No records found
 *                 value:
 *                   status: "success"
 *                   data:
 *                     records: []
 *       400:
 *         description: Bad request - Invalid query parameters
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
 *                   example: "serviceCenterId is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *         description: Forbidden - Insufficient permissions
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
 *                   example: "Access denied. Required role: service_center_staff, service_center_manager, or service_center_technician"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.get(
  "/",
  authentication,
  authorizationByRole([
    "service_center_staff",
    "service_center_manager",
    "service_center_technician",
  ]),
  async (req, res, next) => {
    const vehicleProcessingRecordController = req.container.resolve(
      "vehicleProcessingRecordController"
    );

    await vehicleProcessingRecordController.getAllRecords(req, res, next);
  }
);

export default router;
