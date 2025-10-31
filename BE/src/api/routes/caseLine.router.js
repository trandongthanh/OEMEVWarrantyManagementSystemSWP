import express from "express";
import {
  createCaseLinesSchema,
  assignTechnicianParamsSchema,
  assignTechnicianBodySchema,
  allocateStockParamsSchema,
  approveCaselineBodySchema,
  updateCaselineBodySchema,
  updateCaselineParamsSchema,
  caseLineSchema,
  getCaseLineByIdParamsSchema,
  getAllCaselinesQuerySchema,
} from "../../validators/caseLine.validator.js";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  ensureOtpVerified,
  validate,
} from "../middleware/index.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /case-lines:
 *   get:
 *     summary: Get list of case lines with filters
 *     description: Retrieve a paginated list of case lines with optional filters. Service center users can only see case lines from their service center.
 *     tags: [Case Line]
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
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CUSTOMER_APPROVED, REJECTED, READY_FOR_REPAIR, IN_PROGRESS, REPAIR_COMPLETED, QUALITY_CHECKED]
 *         description: Filter by case line status
 *         example: "PENDING"
 *       - in: query
 *         name: guaranteeCaseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by guarantee case ID
 *         example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *       - in: query
 *         name: warrantyStatus
 *         schema:
 *           type: string
 *           enum: [ELIGIBLE, INELIGIBLE]
 *         description: Filter by warranty eligibility status
 *         example: "ELIGIBLE"
 *       - in: query
 *         name: vehicleProcessingRecordId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle processing record ID
 *         example: "abc12345-6789-0def-ghij-klmnopqrstuv"
 *       - in: query
 *         name: diagnosticTechId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by diagnostic technician ID
 *         example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *       - in: query
 *         name: repairTechId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by repair technician ID
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, status, warrantyStatus]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *         example: "DESC"
 *     responses:
 *       200:
 *         description: Case lines retrieved successfully
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           caseLineId:
 *                             type: string
 *                             format: uuid
 *                             example: "770e8400-e29b-41d4-a716-446655440003"
 *                           guaranteeCaseId:
 *                             type: string
 *                             format: uuid
 *                             example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                           diagnosisText:
 *                             type: string
 *                             example: "Pin cao áp bị suy giảm dung lượng"
 *                           correctionText:
 *                             type: string
 *                             example: "Thay thế pin cao áp mới"
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                           quantity:
 *                             type: integer
 *                             example: 1
 *                           quantityReserved:
 *                             type: integer
 *                             example: 0
 *                           warrantyStatus:
 *                             type: string
 *                             enum: [ELIGIBLE, INELIGIBLE]
 *                             example: "ELIGIBLE"
 *                           status:
 *                             type: string
 *                             example: "PENDING"
 *                           diagnosticTechId:
 *                             type: string
 *                             format: uuid
 *                             example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                           repairTechId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             example: null
 *                           rejectionReason:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-26T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-26T10:30:00.000Z"
 *                           GuaranteeCase:
 *                             type: object
 *                             properties:
 *                               guaranteeCaseId:
 *                                 type: string
 *                                 format: uuid
 *                               caseNumber:
 *                                 type: string
 *                                 example: "GC-2025-001"
 *                           TypeComponent:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               typeComponentId:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                                 example: "Pin Lithium-ion 60kWh"
 *                           DiagnosticTech:
 *                             type: object
 *                             properties:
 *                               userId:
 *                                 type: string
 *                                 format: uuid
 *                               fullName:
 *                                 type: string
 *                                 example: "Nguyễn Văn An"
 *                           RepairTech:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               userId:
 *                                 type: string
 *                                 format: uuid
 *                               fullName:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 45
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *             examples:
 *               withFilters:
 *                 summary: Filtered case lines with pagination
 *                 value:
 *                   status: "success"
 *                   data:
 *                     caseLines:
 *                       - caseLineId: "770e8400-e29b-41d4-a716-446655440003"
 *                         guaranteeCaseId: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                         diagnosisText: "Pin cao áp bị suy giảm dung lượng"
 *                         correctionText: "Thay thế pin cao áp mới"
 *                         typeComponentId: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                         quantity: 1
 *                         quantityReserved: 0
 *                         warrantyStatus: "ELIGIBLE"
 *                         status: "PENDING"
 *                         diagnosticTechId: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                         createdAt: "2025-10-26T10:30:00.000Z"
 *                         updatedAt: "2025-10-26T10:30:00.000Z"
 *                         GuaranteeCase:
 *                           guaranteeCaseId: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *                           caseNumber: "GC-2025-001"
 *                         TypeComponent:
 *                           typeComponentId: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                           name: "Pin Lithium-ion 60kWh"
 *                         DiagnosticTech:
 *                           userId: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                           fullName: "Nguyễn Văn An"
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 5
 *                       totalItems: 45
 *                       itemsPerPage: 10
 *                       hasNextPage: true
 *                       hasPrevPage: false
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
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires service center roles
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authentication,
  authorizationByRole([
    "service_center_technician",
    "service_center_staff",
    "service_center_manager",
    "service_center_manager",
  ]),
  validate(getAllCaselinesQuerySchema, "query"),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");
    await caseLineController.getCaseLines(req, res, next);
  }
);

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
 *                     evidenceImageUrls:
 *                       type: array
 *                       description: Optional array of supporting image URLs captured during diagnosis
 *                       items:
 *                         type: string
 *                         format: uri
 *                       example:
 *                         - "https://cdn.example.com/case-lines/diagnosis/evidence-01.jpg"
 *                         - "https://cdn.example.com/case-lines/diagnosis/evidence-02.jpg"
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
 *                     evidenceImageUrls:
 *                       - "https://cdn.example.com/case-lines/diagnosis/evidence-01.jpg"
 *                   - diagnosisText: "Kiểm tra hệ thống phanh, phát hiện má phanh trước bị mòn dưới mức an toàn."
 *                     correctionText: "Thay thế bộ má phanh trước mới."
 *                     componentId: "cce9b4f8-bfd3-45d9-b650-8773383c90eb"
 *                     quantity: 5
 *                     warrantyStatus: "ELIGIBLE"
 *                     evidenceImageUrls: []
 *             mixedWarranty:
 *               summary: Mixed warranty status cases
 *               value:
 *                 caselines:
 *                   - diagnosisText: "Pin cao áp bị suy giảm dung lượng sau 2 năm sử dụng."
 *                     correctionText: "Thay thế pin cao áp mới theo bảo hành."
 *                     componentId: "abc123-def4-5678-90ab-cdef12345678"
 *                     quantity: 1
 *                     warrantyStatus: "ELIGIBLE"
 *                     evidenceImageUrls:
 *                       - "https://cdn.example.com/case-lines/battery/evidence-01.jpg"
 *                   - diagnosisText: "Trầy xước ở cản trước do va chạm nhẹ."
 *                     correctionText: "Sơn lại cản trước."
 *                     componentId: null
 *                     quantity: 0
 *                     warrantyStatus: "INELIGIBLE"
 *                     evidenceImageUrls: []
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
  validate(createCaseLinesSchema, "body"),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.createCaseLines(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/approve:
 *   patch:
 *     summary: Phê duyệt/Từ chối danh sách caseline
 *     description: |-
 *       Service Center Staff xử lý caseline đang chờ khách hàng xác nhận. Trước khi gọi endpoint này, hệ thống yêu cầu khách hàng xác thực OTP qua email.
 *       Tất cả caseline thuộc cùng `vehicleProcessingRecord` phải được gửi kèm.
 *       Khi toàn bộ caseline được xử lý và hồ sơ chuyển sang trạng thái `PROCESSING`, backend phát socket `vehicleProcessingRecordStatusUpdated`
 *       tới phòng `service_center_staff_{serviceCenterId}` với payload `{ vehicleProcessingRecordId, status }`.
 *     tags: [Case Line]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvedCaseLineIds
 *               - rejectedCaseLineIds
 *               - approverEmail
 *             properties:
 *               approvedCaseLineIds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                 description: Array of case line IDs to approve
 *                 example: [{ "id": "770e8400-e29b-41d4-a716-446655440003" }]
 *               rejectedCaseLineIds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                 description: Array of case line IDs to reject
 *                 example: [{ "id": "990e8400-e29b-41d4-a716-446655440005" }]
 *               approverEmail:
 *                 type: string
 *                 format: email
 *                 description: Email của khách/visitor đã xác thực OTP
 *                 example: "customer@example.com"
 *     responses:
 *       200:
 *         description: Case lines processed successfully
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
 *                     formattedApprovedCaselines:
 *                       type: array
 *                       description: Danh sách caseline chuyển sang trạng thái CUSTOMER_APPROVED
 *                       items:
 *                         type: object
 *                         properties:
 *                           caselineId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             example: "CUSTOMER_APPROVED"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     formattedRejectedCaselines:
 *                       type: array
 *                       description: Danh sách caseline chuyển sang trạng thái REJECTED_BY_CUSTOMER
 *                       items:
 *                         type: object
 *                         properties:
 *                           caselineId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             example: "REJECTED_BY_CUSTOMER"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service_center_staff role và OTP đã xác thực
 *       404:
 *         description: One or more case lines not found
 */
router.patch(
  "/approve",
  authentication,
  authorizationByRole(["service_center_staff"]),
  validate(approveCaselineBodySchema, "body"),
  ensureOtpVerified,
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");
    await caseLineController.approveCaseline(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/case-line:
 *   post:
 *     summary: Create a single case line
 *     description: Create a single case line (diagnosis and correction work item) for a guarantee case. Only technicians can create case lines.
 *     tags: [Case Line]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *               - diagnosisText
 *               - correctionText
 *               - typeComponentId
 *               - quantity
 *               - warrantyStatus
 *             properties:
 *               caseId:
 *                 type: string
 *                 format: uuid
 *                 description: Guarantee case ID
 *                 example: "110f907d-009d-441f-88ad-f9522ae44d0d"
 *               diagnosisText:
 *                 type: string
 *                 description: Diagnostic findings
 *                 example: "Pin cao áp bị suy giảm dung lượng"
 *               correctionText:
 *                 type: string
 *                 description: Corrective action
 *                 example: "Thay thế pin cao áp mới"
 *               typeComponentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Component type ID
 *                 example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Quantity of components
 *                 example: 1
 *               warrantyStatus:
 *                 type: string
 *                 enum: [ELIGIBLE, INELIGIBLE]
 *                 description: Warranty eligibility status
 *                 example: "ELIGIBLE"
 *     responses:
 *       201:
 *         description: Case line created successfully
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
 *                     caseLine:
 *                       type: object
 *                       properties:
 *                         caseLineId:
 *                           type: string
 *                           format: uuid
 *                         diagnosisText:
 *                           type: string
 *                         correctionText:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                         warrantyStatus:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service_center_technician role
 */
router.post(
  "/case-line",
  authentication,
  authorizationByRole(["service_center_technician"]),
  attachCompanyContext,
  validate(caseLineSchema, "body"),

  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.createCaseLine(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/{caselineId}:
 *   get:
 *     summary: Get case line details by ID
 *     description: Retrieve detailed information about a specific case line. Accessible by technicians, staff, and managers.
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
 *         description: Case line ID
 *         example: "770e8400-e29b-41d4-a716-446655440003"
 *     responses:
 *       200:
 *         description: Case line retrieved successfully
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
 *                     caseLine:
 *                       type: object
 *                       properties:
 *                         caseLineId:
 *                           type: string
 *                           format: uuid
 *                         guaranteeCaseId:
 *                           type: string
 *                           format: uuid
 *                         diagnosisText:
 *                           type: string
 *                         correctionText:
 *                           type: string
 *                         componentId:
 *                           type: string
 *                           format: uuid
 *                         quantity:
 *                           type: integer
 *                         quantityReserved:
 *                           type: integer
 *                         warrantyStatus:
 *                           type: string
 *                         status:
 *                           type: string
 *                         techId:
 *                           type: string
 *                           format: uuid
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Case line not found
 */
router.get(
  "/:caselineId",
  authentication,
  authorizationByRole([
    "service_center_technician",
    "service_center_staff",
    "service_center_manager",
    "emv_staff",
  ]),
  attachCompanyContext,
  validate(getCaseLineByIdParamsSchema, "params"),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");
    await caseLineController.getCaseLineById(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/{caselineId}:
 *   patch:
 *     summary: Update case line information
 *     description: Update case line details including diagnosis, correction, component, and warranty status. Only technicians can update.
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
 *         description: Case line ID
 *         example: "770e8400-e29b-41d4-a716-446655440003"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosisText:
 *                 type: string
 *                 description: Updated diagnostic findings
 *                 example: "Pin cao áp bị suy giảm dung lượng nghiêm trọng"
 *               correctionText:
 *                 type: string
 *                 description: Updated corrective action
 *                 example: "Thay thế pin cao áp mới theo bảo hành"
 *               typeComponentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Updated component type ID
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Updated quantity
 *               warrantyStatus:
 *                 type: string
 *                 enum: [ELIGIBLE, INELIGIBLE]
 *                 description: Updated warranty status
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection (if applicable)
 *     responses:
 *       200:
 *         description: Case line updated successfully
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
 *                     caseLine:
 *                       type: object
 *                       properties:
 *                         caseLineId:
 *                           type: string
 *                           format: uuid
 *                         diagnosisText:
 *                           type: string
 *                         correctionText:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service_center_technician role
 *       404:
 *         description: Case line not found
 */
router.patch(
  "/:caselineId",
  authentication,
  authorizationByRole(["service_center_technician"]),
  attachCompanyContext,
  validate(updateCaselineParamsSchema, "params"),
  validate(updateCaselineBodySchema, "body"),

  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.updateCaseline(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/{caselineId}/allocate-stock:
 *   post:
 *     summary: Allocate stock for a caseline
 *     description: Automatically allocate available stock (components) to a caseline based on FIFO (First In First Out) strategy. The system will search for available stock across warehouses and create component reservations. Only service center managers can allocate stock.
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
 *         description: Caseline ID to allocate stock for
 *         example: "770e8400-e29b-41d4-a716-446655440003"
 *     responses:
 *       200:
 *         description: Stock allocated successfully
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
 *                   example: "Stock allocated successfully"
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
 *                         componentId:
 *                           type: string
 *                           format: uuid
 *                           example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                         quantity:
 *                           type: integer
 *                           example: 5
 *                         quantityReserved:
 *                           type: integer
 *                           description: Total quantity reserved from warehouses
 *                           example: 5
 *                         status:
 *                           type: string
 *                           example: "READY_FOR_REPAIR"
 *                     reservations:
 *                       type: array
 *                       description: List of component reservations created
 *                       items:
 *                         type: object
 *                         properties:
 *                           reservationId:
 *                             type: string
 *                             format: uuid
 *                             example: "abc12345-6789-0def-ghij-klmnopqrstuv"
 *                           caselineId:
 *                             type: string
 *                             format: uuid
 *                             example: "770e8400-e29b-41d4-a716-446655440003"
 *                           stockId:
 *                             type: string
 *                             format: uuid
 *                             example: "stock-uuid-1234"
 *                           warehouseId:
 *                             type: string
 *                             format: uuid
 *                             example: "warehouse-uuid-5678"
 *                           warehouseName:
 *                             type: string
 *                             example: "Kho Trung Tâm HCM"
 *                           componentId:
 *                             type: string
 *                             format: uuid
 *                             example: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                           quantityReserved:
 *                             type: integer
 *                             description: Quantity reserved from this warehouse
 *                             example: 3
 *                           status:
 *                             type: string
 *                             example: "RESERVED"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-21T08:30:00.000Z"
 *             examples:
 *               successfulAllocation:
 *                 summary: Stock allocated from multiple warehouses
 *                 value:
 *                   status: "success"
 *                   message: "Stock allocated successfully"
 *                   data:
 *                     caseline:
 *                       caselineId: "770e8400-e29b-41d4-a716-446655440003"
 *                       componentId: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                       quantity: 5
 *                       quantityReserved: 5
 *                       status: "READY_FOR_REPAIR"
 *                     reservations:
 *                       - reservationId: "res-001"
 *                         caselineId: "770e8400-e29b-41d4-a716-446655440003"
 *                         stockId: "stock-001"
 *                         warehouseId: "wh-001"
 *                         warehouseName: "Kho Trung Tâm HCM"
 *                         componentId: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                         quantityReserved: 3
 *                         status: "RESERVED"
 *                         createdAt: "2025-10-21T08:30:00.000Z"
 *                       - reservationId: "res-002"
 *                         caselineId: "770e8400-e29b-41d4-a716-446655440003"
 *                         stockId: "stock-002"
 *                         warehouseId: "wh-002"
 *                         warehouseName: "Kho Quận 7"
 *                         componentId: "1096033d-f11f-4a49-a751-8be0cfb9d705"
 *                         quantityReserved: 2
 *                         status: "RESERVED"
 *                         createdAt: "2025-10-21T08:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid caseline ID format
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
 *                   example: "caselineId must be a valid UUID"
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
 *         description: Forbidden - Requires service_center_manager role
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
 *                   example: "Access denied. Required role: service_center_manager"
 *       404:
 *         description: Caseline not found or no available stock
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
 *                   example: "No available stock found for allocation"
 *       409:
 *         description: Conflict - Caseline status not valid for allocation or stock already allocated
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
 *                   example: "Caseline must be in CUSTOMER_APPROVED status to allocate stock"
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
  "/:caselineId/allocate-stock",
  authentication,
  authorizationByRole(["service_center_manager"]),
  validate(allocateStockParamsSchema, "params"),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.allocateStockForCaseline(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/{caselineId}/assign-technician:
 *   post:
 *     summary: Giao caseline cho kỹ thuật viên
 *     description: |-
 *       Service Center Manager chỉ định kỹ thuật viên sửa chữa caseline ở trạng thái `READY_FOR_REPAIR`.
 *       Sau khi giao việc, backend phát socket `newRepairTaskAssigned` tới phòng `service_center_technician_{technicianId}`
 *       với payload `{ taskAssignment, caseline }`.
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
 *                         repairTechId:
 *                           type: string
 *                           format: uuid
 *                           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                         status:
 *                           type: string
 *                           example: "IN_PROGRESS"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
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
router.patch(
  "/:caselineId/assign-technician",
  authentication,
  authorizationByRole(["service_center_manager"]),
  validate(assignTechnicianParamsSchema, "params"),
  validate(assignTechnicianBodySchema, "body"),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.assignTechnicianToRepairCaseline(req, res, next);
  }
);

/**
 * @swagger
 * /case-lines/{caselineId}/mark-repair-complete:
 *   patch:
 *     summary: Đánh dấu hoàn tất sửa chữa (Technician)
 *     description: |-
 *       Kỹ thuật viên được giao xác nhận caseline đã hoàn tất. Hệ thống chuyển caseline sang `COMPLETED`, đóng task assignment tương ứng
 *       và kiểm tra toàn bộ hồ sơ. Nếu mọi caseline thuộc hồ sơ đều hoàn tất, backend phát socket `vehicleProcessingRecordStatusUpdated`
 *       tới phòng `service_center_staff_{serviceCenterId}` với payload `{ roomName, updatedRecord }` báo hồ sơ chuyển `READY_FOR_PICKUP`.
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
 *         description: ID của caseline cần đánh dấu hoàn tất
 *         example: "770e8400-e29b-41d4-a716-446655440003"
 *     responses:
 *       200:
 *         description: Đánh dấu hoàn tất thành công
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
 *                   example: "Caseline marked as repair completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCaseline:
 *                       type: array
 *                       description: Kết quả cập nhật trạng thái caseline (mảng từ repository)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             example: "COMPLETED"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     updatedTaskAssignment:
 *                       type: object
 *                       description: Task assignment sau khi đóng
 *                       properties:
 *                         taskAssignmentId:
 *                           type: string
 *                           format: uuid
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                         isActive:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Dữ liệu không hợp lệ
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
 *                   example: "caselineId must be a valid UUID"
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (chỉ Technician được assigned)
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
 *                   example: "Only assigned technician can mark repair complete"
 *       404:
 *         description: Không tìm thấy caseline
 *       409:
 *         description: Conflict - Caseline không ở trạng thái IN_PROGRESS
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
 *                   example: "Caseline must be IN_PROGRESS to mark as complete. Current status: READY_FOR_REPAIR"
 */
router.patch(
  "/:caselineId/mark-repair-complete",
  authentication,
  authorizationByRole(["service_center_technician"]),
  async (req, res, next) => {
    const caseLineController = req.container.resolve("caseLineController");

    await caseLineController.markRepairCompleted(req, res, next);
  }
);

export default router;
