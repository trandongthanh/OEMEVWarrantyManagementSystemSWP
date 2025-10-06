import express from "express";
const router = express.Router();

/**
 * @swagger
 * /customer/find-customer-with-phone-or-email:
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
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Bad request - phone or email required
 */
router.get("/customers", async (req, res, next) => {
  const customerController = req.container.resolve("customerController");

  await customerController.findCustomerByPhoneOrEmail(req, res, next);
});

export default router;
