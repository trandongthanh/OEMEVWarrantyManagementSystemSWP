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

router.get("/", authentication, async (req, res, next) => {
  const componentController = req.container.resolve("componentController");

  await componentController.listComponents(req, res, next);
});

export default router;
