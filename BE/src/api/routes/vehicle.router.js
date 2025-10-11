import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /vehicle/find-vehicle-by-vin:
 *   get:
 *     summary: Find vehicle by VIN
 *     tags: [Vehicle]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle Identification Number
 *         example: "011HFDVNVUV302569"
 *     responses:
 *       200:
 *         description: Vehicle found successfully
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
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vin:
 *                           type: string
 *                           example: "011HFDVNVUV302569"
 *                         dateOfManufacture:
 *                           type: string
 *                           format: date-time
 *                           example: "2020-07-28T23:09:59.000Z"
 *                         placeOfManufacture:
 *                           type: string
 *                           format: date-time
 *                           example: "2020-07-28T23:09:59.000Z"
 *                         licensePlate:
 *                           type: string
 *                           example: "51F-987.65"
 *                         purchaseDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-25T00:00:00.000Z"
 *                         owner:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "c8196dc8-8f72-47ee-a773-16f9b554629a"
 *                             fullName:
 *                               type: string
 *                               example: "Trần Đông Thạnh"
 *                             email:
 *                               type: string
 *                               format: email
 *                               example: "thanh@email.com"
 *                             phone:
 *                               type: string
 *                               example: "12345678999"
 *                             address:
 *                               type: string
 *                               example: "123 Đường ABC, Quận 1, TP. HCM"
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-09-28T11:48:31.000Z"
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-09-28T11:48:31.000Z"
 *                         model:
 *                           type: string
 *                           example: "Explorer"
 *                         company:
 *                           type: string
 *                           example: "Polestar"
 *       404:
 *         description: Vehicle not found
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
 *                   example: "Vehicle not found"
 *       401:
 *         description: Unauthorized
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
 *         description: Forbidden - requires service_center_staff role
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
 *                   example: "Access denied. Required role: service_center_staff"
 */
router.get(
  "/:vin",
  authentication,
  authorizationByRole(["service_center_staff"]),
  attachCompanyContext,

  async (req, res, next) => {
    const vehicleController = req.container.resolve("vehicleController");

    await vehicleController.findVehicleByVin(req, res, next);
  }
);

/**
 * @swagger
 * /vehicle/{vin}/register-owner:
 *   patch:
 *     summary: Register customer as vehicle owner
 *     tags: [Vehicle]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle Identification Number
 *         example: "011HFDVNVUV302569"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID to register as owner
 *                 example: "ccdd7f2c-7384-4f5e-bd07-30ee23955219"
 *     responses:
 *       200:
 *         description: Owner registered successfully
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
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vin:
 *                           type: string
 *                           example: "011HFDVNVUV302569"
 *                         dateOfManufacture:
 *                           type: string
 *                           format: date-time
 *                           example: "2020-07-28T23:09:59.000Z"
 *                         placeOfManufacture:
 *                           type: string
 *                           format: date-time
 *                           example: "2020-07-28T23:09:59.000Z"
 *                         licensePlate:
 *                           type: string
 *                           example: "51F-987.65"
 *                         purchaseDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-25T00:00:00.000Z"
 *                         owner:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "ccdd7f2c-7384-4f5e-bd07-30ee23955219"
 *                             fullName:
 *                               type: string
 *                               example: "Nguyễn Thị C"
 *                             email:
 *                               type: string
 *                               format: email
 *                               example: "c.nguyen@email.com"
 *                             phone:
 *                               type: string
 *                               example: "0912345678"
 *                             address:
 *                               type: string
 *                               example: "123 Đường ABC, Quận 1, TP. HCM"
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-09-25T10:37:01.000Z"
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-09-25T10:37:01.000Z"
 *                         model:
 *                           type: string
 *                           example: "Explorer"
 *                         company:
 *                           type: string
 *                           example: "Polestar"
 *       404:
 *         description: Vehicle or customer not found
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
 *                   example: "Vehicle or customer not found"
 *       401:
 *         description: Unauthorized
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
 *         description: Forbidden - requires service_center_staff role
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
 *                   example: "Access denied. Required role: service_center_staff"
 */
router.patch(
  "/:vin",
  authentication,
  authorizationByRole(["service_center_staff"]),
  attachCompanyContext,

  async (req, res, next) => {
    const vehicleController = req.container.resolve("vehicleController");

    await vehicleController.registerCustomerForVehicle(req, res, next);
  }
);

/**
 * @swagger
 * /vehicles/{vin}/warranty:
 *   get:
 *     summary: Get vehicle warranty information
 *     tags: [Vehicle]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle Identification Number
 *         example: "VIN-NEW-0"
 *       - in: query
 *         name: odometer
 *         required: true
 *         schema:
 *           type: number
 *         description: Current odometer reading of the vehicle
 *         example: 123
 *     responses:
 *       200:
 *         description: Vehicle warranty information retrieved successfully
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
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vin:
 *                           type: string
 *                           example: "VIN-NEW-0"
 *                         dateOfManufacture:
 *                           type: string
 *                           format: date-time
 *                         purchaseDate:
 *                           type: string
 *                           format: date-time
 *                         model:
 *                           type: object
 *                           properties:
 *                             vehicleModelName:
 *                               type: string
 *                               example: "Model X"
 *                             generalWarrantyDuration:
 *                               type: integer
 *                               example: 36
 *                             generalWarrantyMileage:
 *                               type: integer
 *                               example: 100000
 *                             typeComponents:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     example: "Battery Pack"
 *                                   price:
 *                                     type: number
 *                                     example: 15000.50
 *                                   WarrantyComponent:
 *                                     type: object
 *                                     properties:
 *                                       quantity:
 *                                         type: integer
 *                                         example: 1
 *                                       durationYear:
 *                                         type: integer
 *                                         example: 8
 *                                       mileageLimit:
 *                                         type: integer
 *                                         example: 160000
 *                                       warrantyStatus:
 *                                         type: string
 *                                         enum: [active, expired, void]
 *                                         example: "active"
 *       400:
 *         description: Bad request - Missing odometer parameter
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
 *                   example: "Odometer reading is required"
 *       404:
 *         description: Vehicle not found
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
 *                   example: "Vehicle not found"
 *       401:
 *         description: Unauthorized
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
 *         description: Forbidden - requires service_center_staff role
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
 *                   example: "Access denied. Required role: service_center_staff"
 */
router.get(
  "/:vin/warranty",
  authentication,
  authorizationByRole(["service_center_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const vehicleController = req.container.resolve("vehicleController");

    await vehicleController.findVehicleByVinWithWarranty(req, res, next);
  }
);

router.post(
  "/:vin/warranty/preview",
  authentication,
  authorizationByRole(["service_center_staff"]),
  attachCompanyContext,
  async (req, res, next) => {
    const vehicleController = req.container.resolve("vehicleController");

    await vehicleController.findVehicleByVinWithWarrantyPreview(req, res, next);
  }
);

export default router;
