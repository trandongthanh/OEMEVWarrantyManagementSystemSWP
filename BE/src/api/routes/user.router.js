import express from "express";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new user (same as register)
 *     tags: [User]
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
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: "+84987654321"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               address:
 *                 type: string
 *                 example: "123 Main Street, Ho Chi Minh City"
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               serviceCenterId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       201:
 *         description: User created successfully
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
 *       400:
 *         description: Bad request - Invalid input data
 *       409:
 *         description: Conflict - User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res, next) => {
  const authController = req.container.resolve("authController");

  await authController.register(req, res, next);
});

/**
 * @swagger
 * /users/technicians:
 *   get:
 *     summary: Get all technicians with their availability and workload
 *     description: Retrieve list of all technicians at the service center with their work schedule for today and current active task count. Only managers can access this endpoint.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [WORKING, DAY_OFF, LEAVE_REQUESTED, LEAVE_APPROVED]
 *         description: Filter technicians by their work schedule status for today
 *         example: "WORKING"
 *     responses:
 *       200:
 *         description: List of technicians retrieved successfully
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
 *                   description: Array of technicians with their current work status
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         description: Unique identifier of the technician
 *                         example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                       name:
 *                         type: string
 *                         description: Full name of the technician
 *                         example: "KTV Dương Giao Linh"
 *                       activeTaskCount:
 *                         type: integer
 *                         description: Number of active tasks currently assigned to this technician
 *                         example: 3
 *                       workSchedule:
 *                         type: object
 *                         description: Work schedule for today
 *                         properties:
 *                           workDate:
 *                             type: string
 *                             format: date
 *                             description: The date of the work schedule
 *                             example: "2025-10-13"
 *                           status:
 *                             type: string
 *                             enum: [WORKING, DAY_OFF, LEAVE_REQUESTED, LEAVE_APPROVED]
 *                             description: Work status for today
 *                             example: "WORKING"
 *             examples:
 *               workingTechnicians:
 *                 summary: List of working technicians
 *                 value:
 *                   status: "success"
 *                   data:
 *                     - userId: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                       name: "KTV Dương Giao Linh"
 *                       activeTaskCount: 3
 *                       workSchedule:
 *                         workDate: "2025-10-13"
 *                         status: "WORKING"
 *                     - userId: "825d1073-9660-48ae-b970-7c8db76f676e"
 *                       name: "KTV Nguyễn Văn An"
 *                       activeTaskCount: 1
 *                       workSchedule:
 *                         workDate: "2025-10-13"
 *                         status: "WORKING"
 *               mixedStatus:
 *                 summary: Technicians with different statuses
 *                 value:
 *                   status: "success"
 *                   data:
 *                     - userId: "725d1073-9660-48ae-b970-7c8db76f676d"
 *                       name: "KTV Dương Giao Linh"
 *                       activeTaskCount: 2
 *                       workSchedule:
 *                         workDate: "2025-10-13"
 *                         status: "WORKING"
 *                     - userId: "825d1073-9660-48ae-b970-7c8db76f676e"
 *                       name: "KTV Trần Minh Tuấn"
 *                       activeTaskCount: 0
 *                       workSchedule:
 *                         workDate: "2025-10-13"
 *                         status: "DAY_OFF"
 *       400:
 *         description: Bad request - Invalid status parameter
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
 *                   example: "Invalid status value"
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Requires service_center_manager role
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
 *                   example: "Access denied. Required role: service_center_manager"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.get(
  "/technicians",
  authentication,
  authorizationByRole(["service_center_manager"]),
  async (req, res, next) => {
    const userController = req.container.resolve("userController");

    await userController.getTechnicians(req, res, next);
  }
);

export default router;
