import express from "express";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /component-reservations/{reservationId}/pickup:
 *   patch:
 *     summary: Pickup reserved components from warehouse
 *     description: Parts coordinator picks up reserved components from warehouse. Updates reservation status from RESERVED to PICKED_UP and updates component status.
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
 *                     reservation:
 *                       type: object
 *                       properties:
 *                         reservationId:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "PICKED_UP"
 *                         pickedUpBy:
 *                           type: string
 *                           format: uuid
 *                         pickedUpAt:
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
 *                           example: "PICKED_UP"
 *                     caseLine:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                           example: "IN_REPAIR"
 *       400:
 *         description: Bad request - Invalid reservation ID
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
  "/:reservationId/pickup",
  authentication,
  authorizationByRole(["parts_coordinator_service_center"]),
  async (req, res, next) => {
    const componentReservationsController = req.container.resolve(
      "componentReservationsController"
    );

    await componentReservationsController.pickupReservedComponent(
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
