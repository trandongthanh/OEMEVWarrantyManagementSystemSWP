import db from "../models/index.cjs";

const { ComponentReservation } = db;

class ComponentReservationRepository {
  bulkCreate = async (componentReservations, option = t) => {
    const newComponentReservation = await ComponentReservation.bulkCreate(
      componentReservations,
      {
        transaction: option,
      }
    );

    return newComponentReservation.toJSON();
  };
}

export default ComponentReservationRepository;
