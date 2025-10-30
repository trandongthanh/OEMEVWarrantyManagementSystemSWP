import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import {
  createInventoryAdjustmentBodySchema,
  createInventoryAdjustmentQuerySchema,
} from "../../validators/inventory.validator.js";

const router = express.Router();

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Lấy tổng hợp tồn kho theo kho
 *     description: Lấy thông tin tổng hợp số lượng tồn kho, đã đặt trước, và khả dụng cho mỗi kho thuộc phạm vi quản lý. Parts coordinator service center chỉ thấy kho của service center mình, parts coordinator company thấy tất cả kho của công ty.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo service center (optional, chỉ áp dụng cho parts_coordinator_company)
 *     responses:
 *       200:
 *         description: Lấy tổng hợp tồn kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       warehouseId:
 *                         type: string
 *                         format: uuid
 *                       warehouseName:
 *                         type: string
 *                         example: Kho Trung Tâm Hà Nội
 *                       totalStock:
 *                         type: integer
 *                         example: 500
 *                         description: Tổng số lượng tồn kho
 *                       totalReserved:
 *                         type: integer
 *                         example: 50
 *                         description: Tổng số lượng đã đặt trước
 *                       totalAvailable:
 *                         type: integer
 *                         example: 450
 *                         description: Tổng số lượng khả dụng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/summary",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.getInventorySummary(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/type-components:
 *   get:
 *     summary: Lấy chi tiết tồn kho theo loại linh kiện
 *     description: Lấy thông tin chi tiết từng loại linh kiện trong kho, bao gồm tên, SKU, danh mục, số lượng tồn kho, đã đặt trước, và khả dụng. Hỗ trợ phân trang và filter theo kho.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo warehouse cụ thể (optional)
 *       - in: query
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo service center (optional, chỉ áp dụng cho parts_coordinator_company)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [HIGH_VOLTAGE_BATTERY, POWERTRAIN, CHARGING_SYSTEM, THERMAL_MANAGEMENT, LOW_VOLTAGE_SYSTEM, BRAKING, SUSPENSION_STEERING, HVAC, BODY_CHASSIS, INFOTAINMENT_ADAS]
 *         description: Filter theo danh mục linh kiện (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (bắt đầu từ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng kết quả mỗi trang
 *     responses:
 *       200:
 *         description: Lấy chi tiết tồn kho thành công
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stockId:
 *                             type: string
 *                             format: uuid
 *                           warehouseId:
 *                             type: string
 *                             format: uuid
 *                           warehouseName:
 *                             type: string
 *                             example: Kho Trung Tâm Hà Nội
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                           typeComponentName:
 *                             type: string
 *                             example: Màn Hình LCD 12 inch
 *                           sku:
 *                             type: string
 *                             example: LCD-12-VF34
 *                           category:
 *                             type: string
 *                             example: INFOTAINMENT_ADAS
 *                           quantityInStock:
 *                             type: integer
 *                             example: 50
 *                           quantityReserved:
 *                             type: integer
 *                             example: 5
 *                           quantityAvailable:
 *                             type: integer
 *                             example: 45
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
 *                           example: 100
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 20
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/type-components",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.getInventoryTypeComponents(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/adjustments:
 *   post:
 *     summary: Tạo điều chỉnh tồn kho thủ công
 *     description: Parts coordinator tạo điều chỉnh tồn kho cho các trường hợp đặc biệt như nhập hàng từ nhà cung cấp, hàng hỏng/mất mát, kiểm kê kho phát hiện chênh lệch. Hệ thống tự động cập nhật quantityInStock và gửi notification.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stockId
 *               - adjustmentType
 *               - quantity
 *               - reason
 *             properties:
 *               stockId:
 *                 type: string
 *                 format: uuid
 *                 description: ID của stock item cần điều chỉnh
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               adjustmentType:
 *                 type: string
 *                 enum: [IN, OUT]
 *                 description: Loại điều chỉnh - IN (nhập kho, tăng tồn) hoặc OUT (xuất kho, giảm tồn)
 *                 example: "IN"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Số lượng điều chỉnh (luôn dương)
 *                 example: 10
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: "Lý do điều chỉnh: DAMAGE (hàng hỏng), LOSS (mất mát), FOUND (tìm thấy), SUPPLIER_DELIVERY (nhập từ NCC), INVENTORY_COUNT (kiểm kê), MANUAL_CORRECTION (sửa lỗi), hoặc lý do khác"
 *                 example: "SUPPLIER_DELIVERY"
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Ghi chú chi tiết về điều chỉnh (optional)
 *                 example: "Nhập 10 màn hình LCD từ nhà cung cấp Samsung, PO#12345, invoice INV-2025-001"
 *     responses:
 *       201:
 *         description: Tạo điều chỉnh tồn kho thành công
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
 *                     adjustment:
 *                       type: object
 *                       properties:
 *                         adjustmentId:
 *                           type: string
 *                           format: uuid
 *                         stockId:
 *                           type: string
 *                           format: uuid
 *                         adjustmentType:
 *                           type: string
 *                           example: "IN"
 *                         quantity:
 *                           type: integer
 *                           example: 10
 *                         reason:
 *                           type: string
 *                           example: "SUPPLIER_DELIVERY"
 *                         note:
 *                           type: string
 *                           example: "Nhập 10 màn hình LCD từ Samsung"
 *                         adjustedByUserId:
 *                           type: string
 *                           format: uuid
 *                         adjustedAt:
 *                           type: string
 *                           format: date-time
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     updatedStock:
 *                       type: object
 *                       properties:
 *                         stockId:
 *                           type: string
 *                           format: uuid
 *                         warehouseId:
 *                           type: string
 *                           format: uuid
 *                         typeComponentId:
 *                           type: string
 *                           format: uuid
 *                         quantityInStock:
 *                           type: integer
 *                           example: 60
 *                           description: Số lượng tồn kho sau khi điều chỉnh
 *                         quantityReserved:
 *                           type: integer
 *                           example: 5
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "quantity must be at least 1"
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy stock item
 *       409:
 *         description: Conflict - Không đủ số lượng khả dụng cho adjustment type OUT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Insufficient available stock. Available: 5, Requested: 10"
 *       500:
 *         description: Lỗi server
 */
router.post(
  "/adjustments",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  validate(createInventoryAdjustmentBodySchema, "body"),
  validate(createInventoryAdjustmentQuerySchema, "query"),
  attachCompanyContext,

  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.createInventoryAdjustment(req, res, next);
  }
);

export default router;
