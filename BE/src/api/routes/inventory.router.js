import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import {
  createInventoryAdjustmentBodySchema,
  // createInventoryAdjustmentQuerySchema,
} from "../../validators/inventory.validator.js";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx, .xls)"));
    }
  },
});

/**
 * @swagger
 * /inventory/template/upload-components:
 *   get:
 *     summary: Tải file Excel mẫu để nhập kho linh kiện
 *     description: Cung cấp một file Excel (.xlsx) mẫu với các cột 'sku' và 'serialNumber' để người dùng điền thông tin và tải lên hệ thống.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: File Excel mẫu được trả về thành công.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/template/upload-components",
  authentication,
  authorizationByRole([
    "parts_coordinator_service_center",
    "parts_coordinator_company",
  ]),
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");
    await inventoryController.getComponentUploadTemplate(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/upload:
 *   post:
 *     summary: Nhập kho hàng loạt linh kiện từ file Excel
 *     description: Tải lên file Excel chứa danh sách linh kiện (SKU và Serial Number) để nhập vào một kho cụ thể.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: File Excel chứa danh sách linh kiện.
 *       - in: formData
 *         name: warehouseId
 *         type: string
 *         required: true
 *         description: ID của kho cần nhập linh kiện vào.
 *       - in: formData
 *         name: adjustmentType
 *         type: string
 *         required: true
 *         enum: [IN]
 *         description: Loại điều chỉnh (chỉ hỗ trợ 'IN').
 *       - in: formData
 *         name: reason
 *         type: string
 *         required: true
 *         description: Lý do nhập kho (ví dụ: SUPPLIER_DELIVERY).
 *       - in: formData
 *         name: note
 *         type: string
 *         description: Ghi chú thêm.
 *     responses:
 *       200:
 *         description: Nhập kho thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully added 15 components to inventory."
 *                 data:
 *                   type: object
 *                   properties:
 *                     addedCount:
 *                       type: integer
 *                       example: 15
 *                     warehouseId:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc file lỗi.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/upload",
  authentication,
  authorizationByRole([
    "parts_coordinator_service_center",
    "parts_coordinator_company",
  ]),
  upload.single("file"),
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");
    await inventoryController.uploadInventoryFromExcel(req, res, next);
  }
);

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
 *   get:
 *     summary: Lấy lịch sử điều chỉnh tồn kho
 *     description: Xem lại lịch sử các lần điều chỉnh tồn kho. Hỗ trợ lọc và phân trang.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng kết quả mỗi trang.
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID của kho.
 *       - in: query
 *         name: typeComponentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID của loại linh kiện.
 *       - in: query
 *         name: adjustedByUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID của người thực hiện điều chỉnh.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công.
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
 *                     adjustments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           adjustmentId:
 *                             type: string
 *                           adjustmentType:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           reason:
 *                             type: string
 *                           note:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           adjustedByUser:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           stock:
 *                             type: object
 *                             properties:
 *                               typeComponent:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   sku:
 *                                     type: string
 *                               warehouse:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/adjustments",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");
    await inventoryController.getAdjustmentHistory(req, res, next);
  }
);

export default router;
