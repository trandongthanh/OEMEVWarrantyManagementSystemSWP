import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

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

export default router;
