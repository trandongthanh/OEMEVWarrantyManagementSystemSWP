import express from "express";
import { validate } from "../middleware/index.js";
import loginSchema from "../../validators/login.validator.js";
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
 * /auth/register:
 *   post:
 *     summary: User registration - Public endpoint (no token required)
 *     description: Register a new user account. This endpoint does not require authentication.
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
 *                 description: Unique username (alphanumeric only)
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Password (min 8 chars, must contain uppercase, lowercase, number, special char)
 *                 example: "Password123!"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 description: User phone number
 *                 example: "+84987654321"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Full name of the user
 *                 example: "John Doe"
 *               address:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: User address
 *                 example: "123 Main Street, Ho Chi Minh City"
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the user role
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               serviceCenterId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the service center (optional, for service center staff/technicians)
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *               vehicleCompanyId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the vehicle company (optional, for OEM staff)
 *                 example: "550e8400-e29b-41d4-a716-446655440002"
 *           examples:
 *             serviceCenterStaff:
 *               summary: Register service center staff
 *               value:
 *                 username: "staff_user"
 *                 password: "StaffPass123!"
 *                 email: "staff@servicecentter.com"
 *                 phone: "+84901234567"
 *                 name: "Nguyen Van A"
 *                 address: "456 Service Road, District 1, HCMC"
 *                 roleId: "role-uuid-for-staff"
 *                 serviceCenterId: "service-center-uuid"
 *             technician:
 *               summary: Register technician
 *               value:
 *                 username: "tech_user"
 *                 password: "TechPass123!"
 *                 email: "tech@servicecenter.com"
 *                 phone: "+84902345678"
 *                 name: "Tran Thi B"
 *                 address: "789 Tech Street, District 3, HCMC"
 *                 roleId: "role-uuid-for-technician"
 *                 serviceCenterId: "service-center-uuid"
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     newUser:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         name:
 *                           type: string
 *                         address:
 *                           type: string
 *                         roleId:
 *                           type: string
 *                         serviceCenterId:
 *                           type: string
 *                           nullable: true
 *                         vehicleCompanyId:
 *                           type: string
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
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
 *                         example: "password"
 *                       message:
 *                         type: string
 *                         example: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
 *       409:
 *         description: Conflict - User already exists (duplicate username/email/phone)
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
 *                   example: "Username already exists"
 *       422:
 *         description: Unprocessable entity - Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/register", async (req, res, next) => {
  const authController = req.container.resolve("authController");

  await authController.register(req, res, next);
});

export default router;
