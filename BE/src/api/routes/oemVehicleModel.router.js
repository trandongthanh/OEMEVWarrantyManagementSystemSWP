import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import createWarrantyComponentsSchema, {
  createWarrantyComponentsParamsSchema,
} from "../../validators/warrantyComponent.validator.js";

const router = express.Router();

/**
 * @swagger
 * /oem-vehicle-models/{vehicleModelId}/warranty-components:
 *   post:
 *     summary: Create warranty components for a vehicle model
 *     tags: [OEM Vehicle Model]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleModelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the vehicle model
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - typeComponentWarrantyList
 *             properties:
 *               typeComponentWarrantyList:
 *                 type: array
 *                 items:
 *                   type: object
 *                   oneOf:
 *                     - properties:
 *                         typeComponentId:
 *                           type: string
 *                           format: uuid
 *                           description: Existing TypeComponent ID
 *                         durationMonth:
 *                           type: integer
 *                           description: Warranty duration in months
 *                         mileageLimit:
 *                           type: integer
 *                           description: Warranty mileage limit
 *                         quantity:
 *                           type: integer
 *                           description: Quantity of this component for the model
 *                       required:
 *                         - typeComponentId
 *                         - durationMonth
 *                         - mileageLimit
 *                         - quantity
 *                     - properties:
 *                         sku:
 *                           type: string
 *                           description: SKU of the new TypeComponent
 *                         name:
 *                           type: string
 *                           description: Name of the new TypeComponent
 *                         price:
 *                           type: number
 *                           format: float
 *                           description: Price of the new TypeComponent
 *                         category:
 *                           type: string
 *                           enum:
 *                             - HIGH_VOLTAGE_BATTERY
 *                             - POWERTRAIN
 *                             - CHARGING_SYSTEM
 *                             - THERMAL_MANAGEMENT
 *                             - LOW_VOLTAGE_SYSTEM
 *                             - BRAKING
 *                             - SUSPENSION_STEERING
 *                             - HVAC
 *                             - BODY_CHASSIS
 *                             - INFOTAINMENT_ADAS
 *                           description: Category of the new TypeComponent
 *                         makeBrand:
 *                           type: string
 *                           nullable: true
 *                           description: Make brand of the new TypeComponent
 *                         durationMonth:
 *                           type: integer
 *                           description: Warranty duration in months
 *                         mileageLimit:
 *                           type: integer
 *                           description: Warranty mileage limit
 *                         quantity:
 *                           type: integer
 *                           description: Quantity of this component for the model
 *                       required:
 *                         - sku
 *                         - name
 *                         - price
 *                         - category
 *                         - durationMonth
 *                         - mileageLimit
 *                         - quantity
 *     responses:
 *       201:
 *         description: Warranty components created successfully
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
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       vehicleModelId:
 *                         type: string
 *                         format: uuid
 *                       typeComponentId:
 *                         type: string
 *                         format: uuid
 *                       quantity:
 *                         type: integer
 *                       durationMonth:
 *                         type: integer
 *                       mileageLimit:
 *                         type: integer
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle model not found
 *       409:
 *         description: Conflict - Type component already exists
 */
router.post(
  "/:vehicleModelId/warranty-components",
  authentication,
  authorizationByRole(["oem_admin"]),
  validate(createWarrantyComponentsParamsSchema, "params"),
  validate(createWarrantyComponentsSchema, "body"),
  async (req, res, next) => {
    const oemVehicleModelController = req.container.resolve(
      "oemVehicleModelController"
    );
    await oemVehicleModelController.createWarrantyComponentsForModel(
      req,
      res,
      next
    );
  }
);

export default router;
