import express from "express";
const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
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
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Bad request
 *       403:
 *         description: ForbiddenError
 */
router.post("/login", async (req, res, next) => {
  const authController = req.container.resolve("authController");

  await authController.login(req, res, next);
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
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
 *                 example: johndoe
 *                 description: Unique username for the user
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *                 description: User password (minimum 6 characters)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *                 description: User email address
 *               phone:
 *                 type: string
 *                 example: "+84987654321"
 *                 description: User phone number
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: Full name of the user
 *               address:
 *                 type: string
 *                 example: "123 Main Street, Ho Chi Minh City"
 *                 description: User address
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: UUID of the user role
 *               serviceCenterId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *                 description: UUID of the service center (optional for some roles)
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
 *                   example: success
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
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid input data
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
 *                   example: "Username already exists"
 *       409:
 *         description: Conflict - User already exists
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

export default router;
