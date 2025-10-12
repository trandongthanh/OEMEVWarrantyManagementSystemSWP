import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
} from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /vehicles/{vin}:
 *   get:
 *     summary: Find vehicle by VIN
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
 *                           example: "Vietnam"
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
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Cannot find vehicle with this vin: 011HFDVNVUV302569"
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
 * /vehicles/{vin}:
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
 *               - dateOfManufacture
 *               - licensePlate
 *               - purchaseDate
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Existing customer ID to register as owner (use this OR customer, not both)
 *                 example: "ccdd7f2c-7384-4f5e-bd07-30ee23955219"
 *               customer:
 *                 type: object
 *                 description: New customer information (use this OR customerId, not both)
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: "Nguyễn Thị C"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "c.nguyen@email.com"
 *                   phone:
 *                     type: string
 *                     example: "0912345678"
 *                   address:
 *                     type: string
 *                     example: "123 Đường ABC, Quận 1, TP. HCM"
 *               dateOfManufacture:
 *                 type: string
 *                 format: date-time
 *                 description: Date of manufacture
 *                 example: "2020-07-28T23:09:59.000Z"
 *               licensePlate:
 *                 type: string
 *                 description: Vehicle license plate
 *                 example: "51F-987.65"
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of purchase (must be after dateOfManufacture)
 *                 example: "2025-10-25T00:00:00.000Z"
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
 *                           example: "Vietnam"
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
 *       400:
 *         description: Bad request - validation error
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
 *                   example: "licensePlate, purchaseDate, dateOfManufacture, customerId is required"
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
 *       409:
 *         description: Conflict - vehicle already has owner
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
 *                   example: "This vehicle has owner"
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
 *                         purchaseDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-25T00:00:00.000Z"
 *                         currentOdometer:
 *                           type: number
 *                           example: 123
 *                         generalWarranty:
 *                           type: object
 *                           properties:
 *                             policy:
 *                               type: object
 *                               properties:
 *                                 durationMonths:
 *                                   type: integer
 *                                   example: 36
 *                                 mileageLimit:
 *                                   type: integer
 *                                   example: 100000
 *                             duration:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: boolean
 *                                   example: true
 *                                 endDate:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2028-10-25T00:00:00.000Z"
 *                                 remainingDays:
 *                                   type: integer
 *                                   example: 1095
 *                             mileage:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   enum: [ACTIVE, INACTIVE]
 *                                   example: "ACTIVE"
 *                                 remainingMileage:
 *                                   type: integer
 *                                   example: 99877
 *                         componentWarranties:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               componentName:
 *                                 type: string
 *                                 example: "Battery Pack"
 *                               policy:
 *                                 type: object
 *                                 properties:
 *                                   durationMonths:
 *                                     type: integer
 *                                     example: 96
 *                                   mileageLimit:
 *                                     type: integer
 *                                     example: 160000
 *                               duration:
 *                                 type: object
 *                                 properties:
 *                                   status:
 *                                     type: string
 *                                     enum: [ACTIVE, INACTIVE]
 *                                     example: "ACTIVE"
 *                                   endDate:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2033-10-25T00:00:00.000Z"
 *                                   remainingDays:
 *                                     type: integer
 *                                     example: 2920
 *                               mileage:
 *                                 type: object
 *                                 properties:
 *                                   status:
 *                                     type: string
 *                                     enum: [ACTIVE, INACTIVE]
 *                                     example: "ACTIVE"
 *                                   remainingMileage:
 *                                     type: integer
 *                                     example: 159877
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
 *                   example: "vin and companyId is required"
 *       404:
 *         description: Vehicle not found or vehicle doesn't have owner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   example: "Cannot check warranty for vehicle with this VIN: VIN-NEW-0 because this vehicle don't have owner"
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

/**
 * @swagger
 * /vehicle/{vin}/warranty/preview:
 *   post:
 *     summary: Preview vehicle warranty information with custom purchase date
 *     description: Get warranty information preview for a vehicle with a specified purchase date and odometer reading
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - odometer
 *               - purchaseDate
 *             properties:
 *               odometer:
 *                 type: number
 *                 minimum: 0
 *                 description: Current odometer reading of the vehicle
 *                 example: 123
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *                 description: Purchase date to preview warranty (must be after date of manufacture and not in future)
 *                 example: "2025-10-25T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Vehicle warranty preview retrieved successfully
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
 *                         purchaseDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-25T00:00:00.000Z"
 *                         currentOdometer:
 *                           type: number
 *                           example: 123
 *                         generalWarranty:
 *                           type: object
 *                           properties:
 *                             policy:
 *                               type: object
 *                               properties:
 *                                 durationMonths:
 *                                   type: integer
 *                                   example: 36
 *                                 mileageLimit:
 *                                   type: integer
 *                                   example: 100000
 *                             duration:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: boolean
 *                                   example: true
 *                                 endDate:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2028-10-25T00:00:00.000Z"
 *                                 remainingDays:
 *                                   type: integer
 *                                   example: 1095
 *                             mileage:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   enum: [ACTIVE, INACTIVE]
 *                                   example: "ACTIVE"
 *                                 remainingMileage:
 *                                   type: integer
 *                                   example: 99877
 *                         componentWarranties:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               componentName:
 *                                 type: string
 *                                 example: "Battery Pack"
 *                               policy:
 *                                 type: object
 *                                 properties:
 *                                   durationMonths:
 *                                     type: integer
 *                                     example: 96
 *                                   mileageLimit:
 *                                     type: integer
 *                                     example: 160000
 *                               duration:
 *                                 type: object
 *                                 properties:
 *                                   status:
 *                                     type: string
 *                                     enum: [ACTIVE, INACTIVE]
 *                                     example: "ACTIVE"
 *                                   endDate:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2033-10-25T00:00:00.000Z"
 *                                   remainingDays:
 *                                     type: integer
 *                                     example: 2920
 *                               mileage:
 *                                 type: object
 *                                 properties:
 *                                   status:
 *                                     type: string
 *                                     enum: [ACTIVE, INACTIVE]
 *                                     example: "ACTIVE"
 *                                   remainingMileage:
 *                                     type: integer
 *                                     example: 159877
 *       400:
 *         description: Bad request - validation error
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
 *                   example: "vin, companyId, purchaseDate and odometer are required"
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   example: "Cannot find vehicle with this VIN: VIN-NEW-0"
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
