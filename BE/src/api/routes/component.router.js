import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import createComponentSchema from "../../validators/component.validator.js";

const router = express.Router();

/**
 * @swagger
 * /components:
 *   post:
 *     summary: Tạo mới component trong kho
 *     description: Parts coordinator hoặc nhân viên OEM thêm component thực tế vào kho; số lượng tồn sẽ tự động tăng.
 *     tags: [Component]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - typeComponentId
 *               - warehouseId
 *               - serialNumber
 *             properties:
 *               typeComponentId:
 *                 type: string
 *                 format: uuid
 *                 description: Loại component tương ứng
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 description: Kho sẽ chứa component này
 *               serialNumber:
 *                 type: string
 *                 description: Mã serial duy nhất của component
 *     responses:
 *       201:
 *         description: Tạo component thành công
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
 *                     component:
 *                       type: object
 *                       description: Component vừa tạo
 *                     stock:
 *                       type: object
 *                       description: Trạng thái stock sau khi cộng tồn
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post(
  "/",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
    "emv_staff",
  ]),
  validate(createComponentSchema, "body"),
  async (req, res, next) => {
    const componentController = req.container.resolve("componentController");

    await componentController.createComponent(req, res, next);
  }
);

/**
 * @swagger
 * /components:
 *   get:
 *     summary: Danh sách component trong kho
 *     description: Liệt kê component với khả năng lọc theo kho, loại linh kiện, trạng thái, serial...
 *     tags: [Component]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chỉ lấy component thuộc kho này
 *       - in: query
 *         name: typeComponentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo loại linh kiện
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_WAREHOUSE, RESERVED, IN_TRANSIT, WITH_TECHNICIAN, INSTALLED, RETURNED]
 *         description: Lọc theo trạng thái component
 *       - in: query
 *         name: serialNumber
 *         schema:
 *           type: string
 *         description: Tìm theo serial cụ thể
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số bản ghi mỗi trang (tối đa 200)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
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
 *                     components:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Thông tin component kèm typeComponent nếu có
 *       401:
 *         description: Chưa xác thực
 */
router.get("/", authentication, async (req, res, next) => {
  const componentController = req.container.resolve("componentController");

  await componentController.listComponents(req, res, next);
});

export default router;
