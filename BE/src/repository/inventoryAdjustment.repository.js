import db from "../models/index.cjs";

const { InventoryAdjustment } = db;

class InventoryAdjustmentRepository {
  createInventoryAdjustment = async (adjustmentData, transaction = null) => {
    const record = await InventoryAdjustment.create(adjustmentData, {
      transaction: transaction,
    });

    return record.toJSON();
  };
}

export default InventoryAdjustmentRepository;
