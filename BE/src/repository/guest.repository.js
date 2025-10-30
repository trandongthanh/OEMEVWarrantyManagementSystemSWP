import db from "../models/index.cjs";

const { Guest } = db;

class GuestRepository {
  async findOrCreate(guestId, transaction) {
    const [guest] = await Guest.findOrCreate({
      where: { guestId: guestId },
      transaction: transaction,
    });

    return guest.toJSON();
  }
}

export default GuestRepository;
