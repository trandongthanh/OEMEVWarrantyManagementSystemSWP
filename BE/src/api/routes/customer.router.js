import express from "express";
const router = express.Router();

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Find customer by phone number or email
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Customer phone number
 *         example: "+84123456789"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Customer email address
 *         example: customer@example.com
 *     responses:
 *       200:
 *         description: Customer found successfully
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
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         fullName:
 *                           type: string
 *                           example: "Nguyễn Văn A"
 *                         phone:
 *                           type: string
 *                           example: "+84123456789"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "customer@example.com"
 *                         address:
 *                           type: string
 *                           example: "123 Đường ABC, Quận 1, TP. HCM"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Customer not found
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
 *                   example: "Customer not found"
 *       400:
 *         description: Bad request - phone or email required
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
 *                   example: "Phone or email parameter is required"
 */
router.get("/", async (req, res, next) => {
  const customerController = req.container.resolve("customerController");

  await customerController.findCustomerByPhoneOrEmail(req, res, next);
});

export default router;
