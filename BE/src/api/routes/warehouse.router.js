import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /warehouse:
 *   get:
 *     summary: Lấy danh sách kho với thông tin chi tiết và tồn kho
 *     description: Lấy danh sách tất cả các kho thuộc phạm vi quản lý với thông tin chi tiết bao gồm service center, company, và tồn kho từng loại linh kiện. Parts coordinator service center chỉ thấy kho của service center mình, parts coordinator company thấy tất cả kho của công ty.
 *     tags: [Warehouse & Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo service center (optional, chỉ áp dụng cho service_center_manager và parts_coordinator_company)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Lấy danh sách kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       warehouseId:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: "Kho Trung Tâm Hà Nội"
 *                       address:
 *                         type: string
 *                         example: "123 Đường ABC, Hà Nội"
 *                       context:
 *                         type: string
 *                         enum: ["SERVICE_CENTER", "COMPANY"]
 *                       entityId:
 *                         type: string
 *                         format: uuid
 *                       priority:
 *                         type: integer
 *                         example: 1
 *                       serviceCenter:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           serviceCenterId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Trung Tâm Bảo Hành Hà Nội"
 *                           address:
 *                             type: string
 *                       company:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           vehicleCompanyId:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "VinFast"
 *                       stocks:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             stockId:
 *                               type: string
 *                               format: uuid
 *                             quantityInStock:
 *                               type: integer
 *                               example: 50
 *                             quantityReserved:
 *                               type: integer
 *                               example: 5
 *                             quantityAvailable:
 *                               type: integer
 *                               example: 45
 *                             typeComponent:
 *                               type: object
 *                               properties:
 *                                 typeComponentId:
 *                                   type: string
 *                                   format: uuid
 *                                 name:
 *                                   type: string
 *                                   example: "Màn Hình LCD 12 inch"
 *                                 sku:
 *                                   type: string
 *                                   example: "LCD-12-VF34"
 *                                 category:
 *                                   type: string
 *                                   example: "INFOTAINMENT_ADAS"
 *                                 price:
 *                                   type: number
 *                                   example: 5000000
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/",
  authentication,
  authorizationByRole([
    "service_center_manager",
    "parts_coordinator_service_center",
    "parts_coordinator_company",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const warehouseController = req.container.resolve("warehouseController");

    await warehouseController.getAllWarehouse(req, res, next);
  }
);

export default router;
