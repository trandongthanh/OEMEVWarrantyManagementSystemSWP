import db from "../models/index.cjs";

const { ComponentReservation } = db;

class ComponentReservationRepository {
  bulkCreate = async ({ componentReservations }, option = null) => {
    const newComponentReservations = await ComponentReservation.bulkCreate(
      componentReservations,
      {
        transaction: option,
      }
    );

    return newComponentReservations.map((cr) => cr.toJSON());
  };
}

export default ComponentReservationRepository;
