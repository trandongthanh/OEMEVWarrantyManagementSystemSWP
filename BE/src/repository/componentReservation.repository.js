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
}

export default ComponentReservationRepository;
