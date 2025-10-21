import express from "express";
import {
  createCaseLinesSchema,
  assignTechnicianParamsSchema,
  assignTechnicianBodySchema,
} from "../../validators/caseLine.validator.js";
import {
  attachCompanyContext,
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
 *     description: Add one or more case lines (diagnosis and correction work items) to a guarantee case. Only the assigned lead technician can create case lines.
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
 *         example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caselines
 *             properties:
 *               caselines:
 *                 type: array
 *                 description: Array of case line items to create
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - diagnosisText
 *                     - correctionText
 *                     - componentId
 *                     - quantity
 *                     - warrantyStatus
 *                   properties:
 *                     diagnosisText:
 *                       type: string
 *                       description: Diagnostic findings and problem description
 *                       example: "Kiểm tra hệ thống điều khiển, phát hiện má phanh trước bị mòn dưới mức an toàn."
 *                     correctionText:
 *                       type: string
 *                       description: Corrective action taken or planned
 *                       example: "Thay thế bộ má phanh trước mới."
 *                     componentId:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       description: ID of the component type to use (can be null if no component replacement needed)
 *                       example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                     quantity:
 *                       type: integer
 *                       minimum: 0
 *                       description: Quantity of components needed
 *                       example: 1
 *                     warrantyStatus:
 *                       type: string
 *                       enum: [ELIGIBLE, INELIGIBLE]
 *                       description: Warranty eligibility status for this case line
 *                       example: "ELIGIBLE"
 *           examples:
 *             brakeReplacement:
 *               summary: Brake system repair with warranty
 *               value:
 *                 caselines:
 *                   - diagnosisText: "Kiểm tra hệ thống điều khiển, phát hiện má phanh trước bị mòn dưới mức an toàn."
 *                     correctionText: "Thay thế bộ má phanh trước mới."
 *                     componentId: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                     quantity: 1
 *                     warrantyStatus: "ELIGIBLE"
 *                   - diagnosisText: "Kiểm tra hệ thống phanh, phát hiện má phanh trước bị mòn dưới mức an toàn."
 *                     correctionText: "Thay thế bộ má phanh trước mới."
 *                     componentId: "cce9b4f8-bfd3-45d9-b650-8773383c90eb"
 *                     quantity: 5
 *                     warrantyStatus: "ELIGIBLE"
 *             mixedWarranty:
 *               summary: Mixed warranty status cases
 *               value:
 *                 caselines:
 *                   - diagnosisText: "Pin cao áp bị suy giảm dung lượng sau 2 năm sử dụng."
 *                     correctionText: "Thay thế pin cao áp mới theo bảo hành."
 *                     componentId: "abc123-def4-5678-90ab-cdef12345678"
 *                     quantity: 1
 *                     warrantyStatus: "ELIGIBLE"
 *                   - diagnosisText: "Trầy xước ở cản trước do va chạm nhẹ."
 *                     correctionText: "Sơn lại cản trước."
 *                     componentId: null
 *                     quantity: 0
 *                     warrantyStatus: "INELIGIBLE"
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseLines:
 *                       type: array
 *                       description: Array of created case lines
 *                       items:
 *                         type: object
 *                         properties:
 *                           caseLineId:
 *                             type: string
 *                             format: uuid
 *                             description: Unique identifier for the case line
 *                             example: "770e8400-e29b-41d4-a716-446655440003"
 *                           guaranteeCaseId:
 *                             type: string
 *                             format: uuid
 *                             description: Associated guarantee case ID
 *                             example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                           diagnosisText:
 *                             type: string
 *                             description: Diagnostic findings
 *                             example: "Kiểm tra hệ thống điều khiển, phát hiện má phanh trước bị mòn dưới mức an toàn."
 *                           correctionText:
 *                             type: string
 *                             description: Corrective action taken
 *                             example: "Thay thế bộ má phanh trước mới."
 *                           componentId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             description: Component type ID
 *                             example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                           quantity:
 *                             type: integer
 *                             description: Quantity of components
 *                             example: 1
 *                           warrantyStatus:
 *                             type: string
 *                             enum: [ELIGIBLE, INELIGIBLE]
 *                             description: Warranty eligibility status
 *                             example: "ELIGIBLE"
 *                           techId:
 *                             type: string
 *                             format: uuid
 *                             description: Technician who created the case line
 *                             example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                           status:
 *                             type: string
 *                             description: Current status of the case line
 *                             example: "pending"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T10:30:00.000Z"
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
 *                         example: "caselines[0].warrantyStatus"
 *                       message:
 *                         type: string
 *                         example: "warrantyStatus must be one of [ELIGIBLE, INELIGIBLE]"
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
 *       404:
 *         description: Guarantee case not found
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
 *       409:
 *         description: Conflict - Technician is not the lead technician for this case
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
 *                   example: "Technician is not the main technician for caselines"
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
router.post(
  "/",
  authentication,
  authorizationByRole(["service_center_technician"]),
  attachCompanyContext,
  validate(createCaseLinesSchema),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.createCaseLine(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/{caselineId}/assign-technician:
 *   post:
 *     summary: Assign a technician to a caseline
 *     description: Assign a technician to handle repairs for a specific caseline. The caseline must be in READY_FOR_REPAIR status. Only service center managers can assign technicians.
 *     tags: [Case Line]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caselineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Caseline ID to assign technician to
 *         example: "770e8400-e29b-41d4-a716-446655440003"
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
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *           example:
 *             technicianId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
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
 *                     caseline:
 *                       type: object
 *                       properties:
 *                         caselineId:
 *                           type: string
 *                           format: uuid
 *                           example: "770e8400-e29b-41d4-a716-446655440003"
 *                         status:
 *                           type: string
 *                           example: "IN_PROGRESS"
 *                     assignment:
 *                       type: object
 *                       properties:
 *                         taskAssignmentId:
 *                           type: string
 *                           format: uuid
 *                           example: "99887766-5544-3322-1100-ffeeddccbbaa"
 *                         technicianId:
 *                           type: string
 *                           format: uuid
 *                           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                         technicianName:
 *                           type: string
 *                           example: "Nguyễn Văn An"
 *                         taskType:
 *                           type: string
 *                           example: "REPAIR"
 *                         status:
 *                           type: string
 *                           example: "ASSIGNED"
 *       400:
 *         description: Bad request - Invalid input
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
 *                   example: "technicianId must be a valid UUID"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires service_center_manager role
 *       404:
 *         description: Caseline or technician not found
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
 *                   example: "Caseline not found"
 *       409:
 *         description: Conflict - Invalid state or technician already assigned
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
 *                   example: "Caseline must be READY_FOR_REPAIR to assign technician. Current status: IN_PROGRESS"
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:caselineId/assign-technician",
  authentication,
  authorizationByRole(["service_center_manager"]),
  validate(assignTechnicianParamsSchema, "params"),
  validate(assignTechnicianBodySchema, "body"),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.assignTechnician(req, res, next);
  }
);

export default router;
