import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import loginSchema from "../../validators/login.validator.js";
import registerInServiceCenterSchema from "../../validators/registerInServiceCenter.validator.js";
const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login - Public endpoint (no token required)
 *     description: Authenticate user and receive JWT access token. This endpoint does not require authentication.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for login
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: "Password123!"
 *           examples:
 *             staffLogin:
 *               summary: Service center staff login
 *               value:
 *                 username: "staff_user"
 *                 password: "StaffPass123!"
 *             technicianLogin:
 *               summary: Technician login
 *               value:
 *                 username: "tech_user"
 *                 password: "TechPass123!"
 *     responses:
 *       200:
 *         description: Login successful - Returns JWT access token
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
 *                     token:
 *                       type: string
 *                       description: JWT access token to use for authenticated requests
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwicm9sZSI6InNlcnZpY2VfY2VudGVyX3N0YWZmIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: "service_center_staff"
 *       400:
 *         description: Bad request - Missing or invalid parameters
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
 *                   example: "Username and password are required"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid credentials
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
 *                   example: "Invalid username or password"
 *       403:
 *         description: Forbidden - Account locked or disabled
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
 *                   example: "Account is locked or disabled"
 *       500:
 *         description: Internal server error
 */
router.post("/login", validate(loginSchema), async (req, res, next) => {
  const authController = req.container.resolve("authController");

  await authController.login(req, res, next);
});

/**
 * @swagger
 * /auth/register-in-service-center:
 *   post:
 *     summary: Tạo tài khoản nhân sự trong trung tâm dịch vụ của quản lý
 *     description: |
 *       Chỉ quản lý trung tâm dịch vụ (`service_center_manager`) mới được phép gọi.
 *       Tài khoản mới luôn gắn với trung tâm của quản lý đang đăng nhập, không thể chỉ định trung tâm khác.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - phone
 *               - name
 *               - address
 *               - roleId
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "staff_user"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt
 *                 example: "StaffPass123!"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "staff@servicecenter.com"
 *               phone:
 *                 type: string
 *                 description: Số điện thoại tại Việt Nam (+84 hoặc 0 và 9-10 chữ số)
 *                 example: "+84901234567"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Nguyen Van A"
 *               address:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "456 Service Road, District 1, HCMC"
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 description: Quyền của tài khoản mới (ví dụ kỹ thuật viên, nhân viên tiếp nhận)
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *           examples:
 *             technician:
 *               summary: Tạo tài khoản kỹ thuật viên
 *               value:
 *                 username: "tech_user"
 *                 password: "TechPass123!"
 *                 email: "tech@servicecenter.com"
 *                 phone: "+84902345678"
 *                 name: "Tran Thi B"
 *                 address: "789 Tech Street, District 3, HCMC"
 *                 roleId: "b7b6b9e3-5e25-4bc5-92cb-6f58f29b1fb3"
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
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
 *                   description: Thông tin người dùng vừa được tạo (không bao gồm mật khẩu)
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc thiếu service center gốc
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không đủ quyền (không phải service_center_manager)
 *       409:
 *         description: Tên đăng nhập đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post(
  "/register-in-service-center",
  authentication,
  authorizationByRole(["service_center_manager"]),
  validate(registerInServiceCenterSchema, "body"),
  async (req, res, next) => {
    const authController = req.container.resolve("authController");

    await authController.registerInServiceCenter(req, res, next);
  }
);

export default router;
