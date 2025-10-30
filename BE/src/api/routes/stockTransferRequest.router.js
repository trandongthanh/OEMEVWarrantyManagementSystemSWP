import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import { stockTransferRequestSchema } from "../../validators/stockTransferRequest.validator.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: StockTransferRequest
 *   description: Quản lý yêu cầu chuyển kho linh kiện từ Service Center lên Hãng
 */

/**
 * @swagger
 * /stock-transfer-requests:
 *   post:
 *     summary: Tạo yêu cầu chuyển kho linh kiện (Service Center → Hãng)
 *     description: |-
 *       Service Center Manager tạo yêu cầu đặt hàng linh kiện từ kho hãng khi không đủ tồn kho.
 *       Sau khi tạo thành công, hệ thống phát sự kiện socket `new_stock_transfer_request`
 *       tới phòng `emv_staff_{companyId}` để thông báo cho bộ phận OEM.
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestingWarehouseId
 *               - items
 *             properties:
 *               requestingWarehouseId:
 *                 type: string
 *                 format: uuid
 *                 description: ID kho Service Center yêu cầu nhận hàng
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *               items:
 *                 type: array
 *                 description: Danh sách linh kiện cần đặt
 *                 items:
 *                   type: object
 *                   required:
 *                     - typeComponentId
 *                     - quantityRequested
 *                   properties:
 *                     typeComponentId:
 *                       type: string
 *                       format: uuid
 *                       description: ID loại linh kiện
 *                       example: "660e8400-e29b-41d4-a716-446655440002"
 *                     quantityRequested:
 *                       type: integer
 *                       minimum: 1
 *                       description: Số lượng yêu cầu
 *                       example: 5
 *                     caselineId:
 *                       type: string
 *                       format: uuid
 *                       description: ID caseline liên quan (optional)
 *                       example: "770e8400-e29b-41d4-a716-446655440003"
 *     responses:
 *       201:
 *         description: Tạo yêu cầu thành công
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         newStockTransferRequest:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             requestingWarehouseId:
 *                               type: string
 *                               format: uuid
 *                             status:
 *                               type: string
 *                               enum: [PENDING_APPROVAL]
 *                               example: "PENDING_APPROVAL"
 *                             requestedByUserId:
 *                               type: string
 *                               format: uuid
 *                             requestedAt:
 *                               type: string
 *                               format: date-time
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                         items:
 *                           description: Danh sách item đã tạo kèm thời gian chuẩn hóa sang múi giờ HCM
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               requestId:
 *                                 type: string
 *                                 format: uuid
 *                               typeComponentId:
 *                                 type: string
 *                                 format: uuid
 *                               quantityRequested:
 *                                 type: integer
 *                               caselineId:
 *                                 type: string
 *                                 format: uuid
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.post(
  "/",
  authentication,
  authorizationByRole(["service_center_manager"]),
  attachCompanyContext,
  validate(stockTransferRequestSchema),

  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.createStockTransferRequest(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu chuyển kho
 *     description: Lấy danh sách yêu cầu chuyển kho theo role (EMV Staff xem tất cả, Service Center chỉ xem của mình)
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_APPROVAL, APPROVED, SHIPPED, RECEIVED, REJECTED, CANCELLED]
 *         description: Lọc theo trạng thái
 *         example: "PENDING_APPROVAL"
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                     stockTransferRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           requestingWarehouseId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             enum: [PENDING_APPROVAL, APPROVED, SHIPPED, RECEIVED, REJECTED, CANCELLED]
 *                           requestedByUserId:
 *                             type: string
 *                             format: uuid
 *                           requestedAt:
 *                             type: string
 *                             format: date-time
 *                           approvedByUserId:
 *                             type: string
 *                             format: uuid
 *                           approvedAt:
 *                             type: string
 *                             format: date-time
 *                           shippedAt:
 *                             type: string
 *                             format: date-time
 *                           receivedAt:
 *                             type: string
 *                             format: date-time
 *                           estimatedDeliveryDate:
 *                             type: string
 *                             format: date
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  "/",
  authentication,
  authorizationByRole([
    "emv_staff",
    "service_center_manager",
    "service_center_staff",
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),

  attachCompanyContext,
  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.getAllStockTransferRequests(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests/{id}:
 *   get:
 *     summary: Lấy chi tiết yêu cầu chuyển kho
 *     description: Lấy thông tin chi tiết một yêu cầu chuyển kho bao gồm items, warehouse, user
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của yêu cầu chuyển kho
 *         example: "880e8400-e29b-41d4-a716-446655440004"
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         requestingWarehouseId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                         requestedByUserId:
 *                           type: string
 *                           format: uuid
 *                         requestedBy:
 *                           type: object
 *                           description: Thông tin user tạo request
 *                         requestingWarehouse:
 *                           type: object
 *                           description: Thông tin kho nhận hàng
 *                         items:
 *                           type: array
 *                           description: Danh sách linh kiện trong request
 *                           items:
 *                             type: object
 *                         stockReservations:
 *                           type: array
 *                           description: Danh sách reservation (nếu đã approve)
 *       404:
 *         description: Không tìm thấy request
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  "/:id",
  authentication,
  authorizationByRole([
    "emv_staff",
    "service_center_manager",
    "service_center_staff",
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.getStockTransferRequestById(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests/{id}/approve:
 *   patch:
 *     summary: Duyệt yêu cầu chuyển kho (EMV Staff)
 *     description: |-
 *       EMV Staff duyệt yêu cầu và tự động reserve stock từ kho hãng. Hệ thống kiểm tra tồn kho và phân bổ theo FIFO.
 *       Sau khi duyệt thành công, server phát sự kiện socket `stock_transfer_request_approved`
 *       tới phòng `parts_coordinator_company_{companyId}`.
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của yêu cầu chuyển kho
 *         example: "880e8400-e29b-41d4-a716-446655440004"
 *     responses:
 *       200:
 *         description: Duyệt thành công và reserve stock
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         stockReservations:
 *                           type: array
 *                           description: Danh sách stock đã được reserve
 *                           items:
 *                             type: object
 *                             properties:
 *                               stockId:
 *                                 type: string
 *                                 format: uuid
 *                               requestId:
 *                                 type: string
 *                                 format: uuid
 *                               typeComponentId:
 *                                 type: string
 *                                 format: uuid
 *                               quantityReserved:
 *                                 type: integer
 *                               status:
 *                                 type: string
 *                                 example: "RESERVED"
 *                         updatedStockTransferRequest:
 *                           type: object
 *                           description: Request sau khi chuyển sang trạng thái APPROVED
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             status:
 *                               type: string
 *                               example: "APPROVED"
 *                             approvedByUserId:
 *                               type: string
 *                               format: uuid
 *       404:
 *         description: Không tìm thấy request
 *       409:
 *         description: Conflict - Trạng thái không phù hợp hoặc không đủ tồn kho
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
 *                   example: "Kho hãng không đủ tồn kho khả dụng cho linh kiện 'Động cơ điện'. Yêu cầu: 10, Tổng khả dụng: 5."
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (chỉ EMV Staff)
 */
router.patch(
  "/:id/approve",
  authentication,
  authorizationByRole(["emv_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.approveStockTransferRequest(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests/{id}/ship:
 *   patch:
 *     summary: Gửi hàng (Parts Coordinator - Company)
 *     description: |-
 *       Parts Coordinator của hãng xác nhận gửi hàng. Hệ thống sẽ collect components từ kho, cập nhật trạng thái component sang `IN_TRANSIT` và trừ tồn kho.
 *       Sau khi xử lý, server phát sự kiện socket `stock_transfer_request_shipped`
 *       tới các phòng `service_center_staff_{serviceCenterId}`, `service_center_manager_{serviceCenterId}` và `parts_coordinator_service_center_{serviceCenterId}`.
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của yêu cầu chuyển kho
 *         example: "880e8400-e29b-41d4-a716-446655440004"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimatedDeliveryDate
 *             properties:
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày dự kiến giao hàng
 *                 example: "2025-11-05"
 *     responses:
 *       200:
 *         description: Gửi hàng thành công
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         updatedRequest:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             status:
 *                               type: string
 *                               example: "SHIPPED"
 *                             shippedAt:
 *                               type: string
 *                               format: date-time
 *                             estimatedDeliveryDate:
 *                               type: string
 *                               format: date
 *                         componentCollections:
 *                           type: array
 *                           description: Danh sách components đã được collect theo loại (dùng làm log phân bổ)
 *                           items:
 *                             type: object
 *                             properties:
 *                               typeComponentId:
 *                                 type: string
 *                                 format: uuid
 *                               componentIds:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                   format: uuid
 *       404:
 *         description: Không tìm thấy request
 *       409:
 *         description: Conflict - Trạng thái không phải APPROVED hoặc không đủ components
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (chỉ Parts Coordinator Company)
 */
router.patch(
  "/:id/ship",
  authentication,
  authorizationByRole(["parts_coordinator_company"]),
  attachCompanyContext,

  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.shipStockTransferRequest(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests/{id}/receive:
 *   patch:
 *     summary: Nhận hàng (Parts Coordinator - Service Center)
 *     description: |-
 *       Parts Coordinator của Service Center xác nhận nhận hàng. Hệ thống sẽ cập nhật components sang `IN_WAREHOUSE`, cộng tồn kho cho kho Service Center.
 *       Hoàn tất sẽ phát sự kiện socket `stock_transfer_request_received`
 *       tới các phòng `service_center_staff_{serviceCenterId}` và `service_center_manager_{serviceCenterId}`.
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của yêu cầu chuyển kho
 *         example: "880e8400-e29b-41d4-a716-446655440004"
 *     responses:
 *       200:
 *         description: Nhận hàng thành công
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         updatedRequest:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             status:
 *                               type: string
 *                               example: "RECEIVED"
 *                             receivedAt:
 *                               type: string
 *                               format: date-time
 *                         receivedComponentsCount:
 *                           type: integer
 *                           description: Tổng số components đã nhận
 *                           example: 15
 *                         componentsByType:
 *                           type: object
 *                           description: Components được nhận nhóm theo typeComponentId
 *                           additionalProperties:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 componentId:
 *                                   type: string
 *                                   format: uuid
 *                                 serialNumber:
 *                                   type: string
 *                                   nullable: true
 *                                 status:
 *                                   type: string
 *                                   example: "IN_WAREHOUSE"
 *       404:
 *         description: Không tìm thấy request hoặc warehouse
 *       409:
 *         description: Conflict - Trạng thái không phải SHIPPED hoặc không có components
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (chỉ Parts Coordinator Service Center)
 */
router.patch(
  "/:id/receive",
  authentication,
  authorizationByRole(["parts_coordinator_service_center"]),
  attachCompanyContext,
  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.receiveStockTransferRequest(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests/{id}/reject:
 *   patch:
 *     summary: Từ chối yêu cầu chuyển kho (EMV Staff)
 *     description: |-
 *       EMV Staff từ chối yêu cầu chuyển kho với lý do. Chỉ áp dụng cho request đang ở trạng thái `PENDING_APPROVAL`.
 *       Hệ thống phát sự kiện socket `stock_transfer_request_rejected`
 *       tới các phòng `service_center_staff_{requesterServiceCenterId}` và `service_center_manager_{requesterServiceCenterId}`.
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của yêu cầu chuyển kho
 *         example: "880e8400-e29b-41d4-a716-446655440004"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 description: Lý do từ chối
 *                 example: "Không đủ ngân sách cho đợt nhập hàng này"
 *     responses:
 *       200:
 *         description: Từ chối thành công
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "REJECTED"
 *                         rejectedByUserId:
 *                           type: string
 *                           format: uuid
 *                         rejectionReason:
 *                           type: string
 *                           example: "Không đủ ngân sách cho đợt nhập hàng này"
 *       404:
 *         description: Không tìm thấy request
 *       409:
 *         description: Conflict - Chỉ có thể reject request đang PENDING_APPROVAL
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (chỉ EMV Staff)
 */
router.patch(
  "/:id/reject",
  authentication,
  authorizationByRole(["emv_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.rejectStockTransferRequest(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /stock-transfer-requests/{id}/cancel:
 *   patch:
 *     summary: Hủy yêu cầu chuyển kho
 *     description: |-
 *       Hủy yêu cầu chuyển kho với các quyền khác nhau:
 *       - Service Center Manager: chỉ có thể hủy request `PENDING_APPROVAL`
 *       - EMV Staff: có thể hủy request `PENDING_APPROVAL` hoặc `APPROVED` (hệ thống tự động release stock đã reserve).
 *       Sau khi hủy, hệ thống phát sự kiện socket `stock_transfer_request_cancelled`
 *       tới phòng `emv_staff_{companyId}`.
 *     tags: [StockTransferRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của yêu cầu chuyển kho
 *         example: "880e8400-e29b-41d4-a716-446655440004"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancellationReason
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 description: Lý do hủy
 *                 example: "Khách hàng không muốn sửa nữa"
 *     responses:
 *       200:
 *         description: Hủy thành công
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
 *                     stockTransferRequest:
 *                       type: object
 *                       properties:
 *                         updatedRequest:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             status:
 *                               type: string
 *                               example: "CANCELLED"
 *                             cancelledByUserId:
 *                               type: string
 *                               format: uuid
 *                             cancellationReason:
 *                               type: string
 *       404:
 *         description: Không tìm thấy request
 *       409:
 *         description: Conflict - Trạng thái không phù hợp để cancel
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.patch(
  "/:id/cancel",
  authentication,
  authorizationByRole(["service_center_manager", "emv_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const stockTransferRequestController = req.container.resolve(
      "stockTransferRequestController"
    );

    await stockTransferRequestController.cancelStockTransferRequest(
      req,
      res,
      next
    );
  }
);

export default router;
