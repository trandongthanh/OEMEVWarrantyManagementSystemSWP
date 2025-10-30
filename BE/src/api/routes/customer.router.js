import express from "express";

import { updateCustomerSchema } from "../../validators/customer.validator.js";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";

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

/**
 * @swagger
 * /customers/{id}:
 *   patch:
 *     summary: Update customer information
 *     description: Update customer details by customer ID. Only service center staff and managers can update customer information.
 *     tags: [Customer]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Customer full name
 *                 example: "Nguyễn Văn A"
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *                 example: "+84123456789"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *                 example: "customer@example.com"
 *               address:
 *                 type: string
 *                 description: Customer address
 *                 example: "123 Đường ABC, Quận 1, TP. HCM"
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         address:
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Customer not found"
 */
router.patch(
  "/:id",
  authentication,
  authorizationByRole(["service_center_staff", "service_center_manager"]),
  validate(updateCustomerSchema, "body"),
  async (req, res, next) => {
    const customerController = req.container.resolve("customerController");

    await customerController.updateCustomerInfo(req, res, next);
  }
);

/**
 * @swagger
 * /customers/all:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a list of all customers. Only service center managers can access this endpoint.
 *     tags: [Customer]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           fullName:
 *                             type: string
 *                             example: "Nguyễn Văn A"
 *                           phone:
 *                             type: string
 *                             example: "+84123456789"
 *                           email:
 *                             type: string
 *                             example: "customer@example.com"
 *                           address:
 *                             type: string
 *                             example: "123 Đường ABC, Quận 1, TP. HCM"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service_center_manager role
 */
router.get(
  "/all",
  authentication,
  authorizationByRole(["service_center_manager"]),
  async (req, res, next) => {
    const customerController = req.container.resolve("customerController");

    await customerController.getAllCustomer(req, res, next);
  }
);

export default router;
