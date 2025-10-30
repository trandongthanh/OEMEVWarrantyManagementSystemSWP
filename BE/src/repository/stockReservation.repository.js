import { Op } from "sequelize";
import db from "../models/index.cjs";

const { StockReservation, Stock, TypeComponent } = db;

class StockReservationRepository {
  bulkCreate = async ({ reservations }, transaction = null) => {
    const newReservations = await StockReservation.bulkCreate(reservations, {
      transaction,
    });

    return newReservations.map((r) => r.toJSON());
  };

  findByRequestId = async ({ requestId }, transaction = null, lock = null) => {
    const reservations = await StockReservation.findAll({
      where: { requestId, status: "RESERVED" },
      include: [
        {
          model: Stock,
          as: "stock",
          include: [
            {
              model: db.Warehouse,
              as: "warehouse",
            },
          ],
        },
        {
          model: TypeComponent,
          as: "typeComponent",
        },
      ],
      transaction,
      lock,
    });

    return reservations.map((r) => r.toJSON());
  };

  updateStatusToShipped = async ({ reservationIds }, transaction = null) => {
    const [affectedRows] = await StockReservation.update(
      { status: "SHIPPED" },
      {
        where: { reservationId: reservationIds },
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
