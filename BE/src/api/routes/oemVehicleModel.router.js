import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import createWarrantyComponentsSchema, {
  createWarrantyComponentsParamsSchema,
} from "../../validators/warrantyComponent.validator.js";
import { updateWarrantyComponentSchema } from "../../validators/oemVehicleModel.validator.js";

const router = express.Router();

/**
 * @swagger
 * /oem-vehicle-models:
 *   get:
 *     summary: Get all vehicle models with their warranty components
 *     tags: [OEM Vehicle Model]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of vehicle models with their warranty policies.
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
 *                       vehicleModelId:
 *                         type: string
 *                         format: uuid
 *                       vehicleModelName:
 *                         type: string
 *                       # ... other vehicle model properties
 *                       warrantyComponents:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             typeComponentId:
 *                               type: string
 *                               format: uuid
 *                             quantity:
 *                               type: integer
 *                             durationMonth:
 *                               type: integer
 *                             mileageLimit:
 *                               type: integer
 *                             typeComponent:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 sku:
 *                                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  authentication,
  authorizationByRole(["emv_admin"]),
  async (req, res, next) => {
    const oemVehicleModelController = req.container.resolve(
      "oemVehicleModelController"
    );
    await oemVehicleModelController.getAllModelsWithWarranty(req, res, next);
  }
);

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
  authorizationByRole(["emv_admin"]),
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

/**
 * @swagger
 * /oem-vehicle-models/{vehicleModelId}/warranty-components/{warrantyComponentId}:
 *   patch:
 *     summary: Update a specific warranty component for a vehicle model
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
 *       - in: path
 *         name: warrantyComponentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the warranty component to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 min: 1
 *                 description: New quantity of this component for the model
 *               durationMonth:
 *                 type: integer
 *                 min: 0
 *                 description: New warranty duration in months
 *               mileageLimit:
 *                 type: integer
 *                 min: 0
 *                 description: New warranty mileage limit
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: Warranty component updated successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     vehicleModelId:
 *                       type: string
 *                       format: uuid
 *                     typeComponentId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                     durationMonth:
 *                       type: integer
 *                     mileageLimit:
 *                       type: integer
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle model or warranty component not found
 */
router.patch(
  "/:vehicleModelId/warranty-components/:warrantyComponentId",
  authentication,
  authorizationByRole(["emv_admin"]),
  validate(createWarrantyComponentsParamsSchema, "params"),
  validate(updateWarrantyComponentSchema, "body"),
  async (req, res, next) => {
    const oemVehicleModelController = req.container.resolve(
      "oemVehicleModelController"
    );
    await oemVehicleModelController.updateWarrantyComponent(req, res, next);
  }
);

/**
 * @swagger
 * /oem-vehicle-models/{vehicleModelId}/warranty-components:
 *   get:
 *     summary: Get all warranty components for a specific vehicle model
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
 *     responses:
 *       200:
 *         description: A list of warranty components for the model
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
 *                       typeComponent:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           sku:
 *                             type: string
 *                           price:
 *                             type: number
 *                           category:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle model not found
 */
router.get(
  "/:vehicleModelId/warranty-components",
  authentication,
  authorizationByRole(["emv_admin"]),
  validate(createWarrantyComponentsParamsSchema, "params"),
  async (req, res, next) => {
    const oemVehicleModelController = req.container.resolve(
      "oemVehicleModelController"
    );
    await oemVehicleModelController.getWarrantyComponentsForModel(
      req,
      res,
      next
    );
  }
);

export default router;
