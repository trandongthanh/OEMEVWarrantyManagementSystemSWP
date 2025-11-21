import { Op } from "sequelize";
import db from "../models/index.cjs";

const {
  StockReservation,
  Stock,
  StockTransferRequestItem,
  StockTransferRequest,
  TypeComponent,
  Warehouse,
} = db;

class StockReservationRepository {
  bulkCreate = async ({ reservations }, transaction = null) => {
    const newReservations = await StockReservation.bulkCreate(reservations, {
      transaction,
    });

    return newReservations.map((r) => r.toJSON());
  };

  findByRequestId = async (
    { requestId, statuses = ["RESERVED"] },
    transaction = null,
    lock = null
  ) => {
    let normalizedStatuses = statuses;

    if (!normalizedStatuses) {
      normalizedStatuses = ["RESERVED"];
    }

    if (
      typeof normalizedStatuses === "string" &&
      normalizedStatuses.toUpperCase() === "ALL"
    ) {
      normalizedStatuses = null;
    } else if (typeof normalizedStatuses === "string") {
      normalizedStatuses = normalizedStatuses
        .split(",")
        .map((status) => status.trim())
        .filter(Boolean);
    }

    const reservationWhere = {};

    if (normalizedStatuses && normalizedStatuses.length > 0) {
      reservationWhere.status =
        normalizedStatuses.length === 1
          ? normalizedStatuses[0]
          : { [Op.in]: normalizedStatuses };
    }

    const reservations = await StockReservation.findAll({
      where: reservationWhere,
      include: [
        {
          model: Stock,
          as: "stock",
          include: [
            {
              model: Warehouse,
              as: "warehouse",
            },
          ],
        },
        {
          model: StockTransferRequestItem,
          as: "requestItem",
          where: { requestId },
          required: true,
          attributes: ["id", "typeComponentId", "quantityRequested"],
          include: [
            {
              model: TypeComponent,
              as: "component",
              attributes: ["typeComponentId", "name", "sku"],
              required: false,
            },
          ],
        },
      ],
      transaction,
      lock,
    });

    return reservations.map((r) => {
      const data = r.toJSON();
      data.typeComponentId = data.requestItem?.typeComponentId ?? null;
      return data;
    });
  };

  findByIdWithDetails = async (
    { reservationId },
    transaction = null,
    lock = null
  ) => {
    const reservation = await StockReservation.findByPk(reservationId, {
      include: [
        {
          model: Stock,
          as: "stock",
          include: [
            {
              model: Warehouse,
              as: "warehouse",
            },
          ],
        },
        {
          model: StockTransferRequestItem,
          as: "requestItem",
          attributes: [
            "id",
            "requestId",
            "typeComponentId",
            "quantityRequested",
          ],
          include: [
            {
              model: TypeComponent,
              as: "component",
              attributes: ["typeComponentId", "name", "sku"],
            },
            {
              model: StockTransferRequest,
              as: "request",
              attributes: ["id", "status"],
            },
          ],
        },
      ],
      transaction,
      lock,
    });

    return reservation ? reservation.toJSON() : null;
  };

  countReservedByRequestId = async (
    { requestId },
    transaction = null,
    lock = null
  ) => {
    const count = await StockReservation.count({
      where: { status: "RESERVED" },
      include: [
        {
          model: StockTransferRequestItem,
          as: "requestItem",
          where: { requestId },
          required: true,
        },
      ],
      transaction,
      lock,
      distinct: true,
      col: "reservation_id",
    });

    return count;
  };

  markReservationsAsShipped = async (
    { reservationIds },
    transaction = null
  ) => {
    if (!reservationIds || reservationIds.length === 0) {
      return 0;
    }

    const [affectedRows] = await StockReservation.update(
      {
        status: "SHIPPED",
      },
      {
        where: {
          reservationId: {
            [Op.in]: reservationIds,
          },
        },
        transaction,
      }
    );

    return affectedRows;
  };

  bulkUpdateStatus = async ({ reservationIds, status }, transaction = null) => {
    const [affectedRows] = await StockReservation.update(
      { status },
      {
        where: {
          reservationId: {
            [Op.in]: reservationIds,
          },
        },
        transaction,
      }
    );

    return affectedRows;
  };

  findByStockId = async ({ stockId }, transaction = null) => {
    const reservations = await StockReservation.findAll({
      where: { stockId, status: "RESERVED" },
      transaction,
    });

    return reservations.map((r) => r.toJSON());
  };
}

export default StockReservationRepository;
