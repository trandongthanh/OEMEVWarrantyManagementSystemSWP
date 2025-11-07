import express from "express";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Lấy danh sách quyền theo phạm vi quản lý
 *     description: |-
 *       Trả về danh sách quyền mà người dùng đang đăng nhập được phép xem. Quản lý trung tâm dịch vụ nhận các quyền thuộc trung tâm, trong khi `emv_admin` nhận danh sách quyền thuộc công ty.
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Số lượng bản ghi mỗi trang (mặc định 10, chỉ áp dụng với quản lý trung tâm dịch vụ)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Số trang cần lấy (mặc định 1, chỉ áp dụng với quản lý trung tâm dịch vụ)
 *     responses:
 *       200:
 *         description: Lấy danh sách quyền thành công
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
 *                       roleId:
 *                         type: string
 *                         format: uuid
 *                         example: 550e8400-e29b-41d4-a716-446655440000
 *                       roleName:
 *                         type: string
 *                         enum:
 *                           - service_center_staff
 *                           - service_center_technician
 *                           - parts_coordinator_service_center
 *                           - service_center_manager
 *                           - emv_staff
 *                           - parts_coordinator_company
 *                           - emv_admin
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không đủ quyền truy cập danh sách quyền
 *       500:
 *         description: Lỗi hệ thống
 */
router.get(
  "/",
  authentication,
  authorizationByRole(["service_center_manager", "emv_admin"]),
  async (req, res, next) => {
    const roleController = req.container.resolve("roleController");

    await roleController.getAllRoles(req, res, next);
  }
);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Tạo quyền mới trong hệ thống
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     description: Chỉ tài khoản `emv_admin` mới được phép thêm quyền mới.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 description: Tên quyền cần tạo (cần trùng với enum trong hệ thống)
 *                 enum:
 *                   - service_center_staff
 *                   - service_center_technician
 *                   - parts_coordinator_service_center
 *                   - service_center_manager
 *                   - emv_staff
 *                   - parts_coordinator_company
 *                   - emv_admin
 *                 example: service_center_staff
 *     responses:
 *       201:
 *         description: Tạo quyền mới thành công
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
 *                     roleId:
 *                       type: string
 *                       format: uuid
 *                     roleName:
 *                       type: string
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không đủ quyền tạo mới
 *       409:
 *         description: Quyền đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post(
  "/",
  authentication,
  authorizationByRole(["emv_admin"]),
  async (req, res, next) => {
    const roleController = req.container.resolve("roleController");

    await roleController.createRole(req, res, next);
  }
);

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     summary: Lấy thông tin chi tiết một quyền
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     description: Cho phép quản lý trung tâm dịch vụ và `emv_admin` xem chi tiết quyền.
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của quyền cần tra cứu
 *     responses:
 *       200:
 *         description: Lấy thông tin quyền thành công
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
 *                     roleId:
 *                       type: string
 *                       format: uuid
 *                     roleName:
 *                       type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không đủ quyền xem chi tiết quyền
 *       404:
 *         description: Không tìm thấy quyền
 *       500:
 *         description: Lỗi hệ thống
 */
router.get(
  "/:roleId",
  authentication,
  authorizationByRole(["service_center_manager", "emv_admin"]),
  async (req, res, next) => {
    const roleController = req.container.resolve("roleController");

    await roleController.getRoleById(req, res, next);
  }
);

export default router;
