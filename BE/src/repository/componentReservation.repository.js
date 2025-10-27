import db from "../models/index.cjs";

const { ComponentReservation } = db;

class ComponentReservationRepository {
  bulkCreate = async ({ componentReservations }, transaction = null) => {
    const newComponentReservations = await ComponentReservation.bulkCreate(
      componentReservations,
      {
        transaction: transaction,
      }
    );

    return newComponentReservations.map((cr) => cr.toJSON());
  };

  updateReservationStatusPickUp = async (
    { reservationId, pickedUpByTechId, pickedUpAt, status = "PICKED_UP" },

    transaction = null
  ) => {
    const [affectedRows] = await ComponentReservation.update(
      {
        status: status,
        pickedUpBy: pickedUpByTechId,
        pickedUpAt: pickedUpAt,
      },
      {
        where: {
          reservationId: reservationId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedReservation = await ComponentReservation.findByPk(
      reservationId,
      {
        transaction: transaction,
      }
    );

    return updatedReservation ? updatedReservation.toJSON() : null;
  };

  findById = async (reservationId, transaction = null, lock = null) => {
    const reservation = await ComponentReservation.findOne({
      where: { reservationId: reservationId },
      transaction: transaction,
      lock: lock,
    });

    return reservation ? reservation.toJSON() : null;
  };

  updateReservationStatusInstall = async (
    { reservationId, installedAt, status = "INSTALLED" },
    transaction = null
  ) => {
    const [affectedRows] = await ComponentReservation.update(
      {
        status: status,
        installedAt: installedAt,
      },
      {
        where: {
          reservationId: reservationId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedReservation = await ComponentReservation.findByPk(
      reservationId,
      {
        transaction: transaction,
      }
    );

    return updatedReservation ? updatedReservation.toJSON() : null;
  };

  updateReservationStatusReturn = async (
    {
      reservationId,
      oldComponentSerial,
      oldComponentReturned,
      returnedAt,
      status = "RETURNED",
    },
    transaction = null
  ) => {
    const [affectedRows] = await ComponentReservation.update(
      {
        status: status,
        returnedAt: returnedAt,
        oldComponentSerial: oldComponentSerial,
        oldComponentReturned: oldComponentReturned,
      },
      {
        where: {
          reservationId: reservationId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedReservation = await ComponentReservation.findByPk(
      reservationId,
      {
        transaction: transaction,
      }
    );

    return updatedReservation ? updatedReservation.toJSON() : null;
  };

  findByCaselineId = async (caseLineId, transaction = null, lock = null) => {
    const reservation = await ComponentReservation.findOne({
      where: { caseLineId },
      transaction: transaction,
      lock: lock,
    });

    return reservation ? reservation.toJSON() : null;
  };
}

export default ComponentReservationRepository;
