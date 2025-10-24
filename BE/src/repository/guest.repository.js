import db from "../models/index.cjs";

const { Guest } = db;

class GuestRepository {
  async findOrCreate(guestId, transaction) {
    const [guest, created] = await Guest.findOrCreate({
      where: { guestId: guestId },
      transaction: transaction,
    });

    if (!created) {
      return null;
    }

    return guest.toJSON();
  }
}

export default GuestRepository;
