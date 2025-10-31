import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import {
  getComponentReservationsQuerySchema,
  pickupReservedComponentSchema,
  returnReservedComponentSchema,
} from "../../validators/componentReservation.validator.js";

const router = express.Router();

/**
 * @swagger
 * /component-reservations:
 *   get:
 *     summary: List component reservations assigned to a service center
 *     description: Parts coordinators can view reservation queue to prepare and hand over components to technicians.
 *     tags: [Component Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Pagination page index
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RESERVED, PICKED_UP, INSTALLED, RETURNED, CANCELLED]
 *           default: RESERVED
 *         description: Filter reservations by status
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse storing the component
 *       - in: query
 *         name: typeComponentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by component type
 *       - in: query
 *         name: caseLineId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific case line
 *       - in: query
 *         name: guaranteeCaseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by guarantee case
 *       - in: query
 *         name: vehicleProcessingRecordId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by processing record
 *       - in: query
 *         name: repairTechId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter reservations assigned to a specific repair technician
 *       - in: query
 *         name: repairTechPhone
 *         schema:
 *           type: string
 *         description: Filter reservations by repair technician phone number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Reservations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires parts coordinator role
 */
router.get(
  "/",
  authentication,
  authorizationByRole(["parts_coordinator_service_center"]),
  validate(getComponentReservationsQuerySchema, "query"),
  async (req, res, next) => {
    const componentReservationsController = req.container.resolve(
      "componentReservationsController"
    );

    await componentReservationsController.getComponentReservations(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /component-reservations/pickup:
 *   patch:
 *     summary: Pickup one or many reserved components from warehouse
 *     description: Parts coordinator checks out reserved components for technicians. Supports picking multiple reservations in a single request, moving them from RESERVED to PICKED_UP and updating stock.
 *     tags: [Component Reservations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationIds
 *               - pickedUpByTechId
 *             properties:
 *               reservationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: List of reservation IDs to pick up
 *                 example:
 *                   - "d1e8d13d-7088-400e-a3d2-fdd584140176"
 *                   - "e9c4caa2-98a1-4b36-9ed9-04eaa40c7b9c"
 *               pickedUpByTechId:
 *                 type: string
 *                 format: uuid
 *                 description: Technician who receives the components
 *                 example: "725d1073-9660-48ae-b970-7c8db76f676d"
 *     responses:
 *       200:
 *         description: Components picked up successfully
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
 *                     reservations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reservationId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             example: "PICKED_UP"
 *                           pickedUpBy:
 *                             type: string
 *                             format: uuid
 *                           pickedUpAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad request - Invalid reservation list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires parts_coordinator_service_center role
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Conflict - Reservation not in RESERVED status
 */
router.patch(
  "/pickup",
  authentication,
  authorizationByRole(["parts_coordinator_service_center"]),
  validate(pickupReservedComponentSchema, "body"),
  async (req, res, next) => {
    const componentReservationsController = req.container.resolve(
      "componentReservationsController"
    );

    await componentReservationsController.pickupReservedComponents(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /component-reservations/{reservationId}/installComponent:
 *   patch:
 *     summary: Install component on vehicle
 *     description: Technician installs picked up component on vehicle. Updates reservation status to INSTALLED, component status to INSTALLED, and links component to vehicle VIN.
 *     tags: [Component Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation ID
 *         example: "d1e8d13d-7088-400e-a3d2-fdd584140176"
 *     responses:
 *       200:
 *         description: Component installed successfully
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
 *                     reservation:
 *                       type: object
 *                       properties:
 *                         reservationId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "INSTALLED"
 *                         installedAt:
 *                           type: string
 *                           format: date-time
 *                     component:
 *                       type: object
 *                       properties:
 *                         componentId:
 *                           type: string
 *                           format: uuid
 *                         serialNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: "INSTALLED"
 *                         vehicleVin:
 *                           type: string
 *                           example: "VFE34TEST00000001"
 *                         installedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid reservation ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires service_center_technician role
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Conflict - Reservation not in PICKED_UP status
 */
router.patch(
  "/:reservationId/installComponent",
  authentication,
  authorizationByRole(["service_center_technician"]),
  async (req, res, next) => {
    const componentReservationsController = req.container.resolve(
      "componentReservationsController"
    );

    await componentReservationsController.installComponent(req, res, next);
  }
);

/**
 * @swagger
 * /component-reservations/{reservationId}/return:
 *   patch:
 *     summary: Return old component after replacement
 *     description: Parts coordinator returns the old component that was replaced. Updates reservation status to RETURNED and marks old component as returned.
 *     tags: [Component Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation ID
 *         example: "d1e8d13d-7088-400e-a3d2-fdd584140176"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 description: Serial number of the old component being returned
 *                 example: "BMS-CTRL-01-SN-OLD-001"
 *     responses:
 *       200:
 *         description: Old component returned successfully
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
 *                     reservation:
 *                       type: object
 *                       properties:
 *                         reservationId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "RETURNED"
 *                         oldComponentSerial:
 *                           type: string
 *                           example: "BMS-CTRL-01-SN-OLD-001"
 *                         oldComponentReturned:
 *                           type: boolean
 *                           example: true
 *                         returnedAt:
 *                           type: string
 *                           format: date-time
 *                     component:
 *                       type: object
 *                       properties:
 *                         componentId:
 *                           type: string
 *                           format: uuid
 *                         serialNumber:
 *                           type: string
 *                           example: "BMS-CTRL-01-SN-OLD-001"
 *                         status:
 *                           type: string
 *                           example: "RETURNED"
 *       400:
 *         description: Bad request - Invalid reservation ID or serial number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires parts_coordinator_service_center role
 *       404:
 *         description: Reservation or component not found
 *       409:
 *         description: Conflict - Reservation not in INSTALLED status or component mismatch
 */
router.patch(
  "/:reservationId/return",
  authentication,
  authorizationByRole(["parts_coordinator_service_center"]),
  validate(returnReservedComponentSchema, "body"),
  async (req, res, next) => {
    const componentReservationsController = req.container.resolve(
      "componentReservationsController"
    );

    await componentReservationsController.returnReservedComponent(
      req,
      res,
      next
    );
  }
);

export default router;
