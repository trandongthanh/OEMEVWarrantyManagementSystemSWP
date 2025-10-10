import express from "express";

const router = express.Router();

/**
 * @swagger
 * /user:
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

// router.get("/technician", async (req, res, next) => {
//   const
// })

export default router;
