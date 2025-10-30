import db from "../models/index.cjs";
const { StockTransferRequestItem, CaseLine } = db;

class StockTransferRequestItemRepository {
  createStockTransferRequestItems = async ({ items }, transaction = null) => {
    const newItems = await StockTransferRequestItem.bulkCreate(items, {
      transaction,
    });

    const formattedItems = newItems.map((item) => item.toJSON());

    return formattedItems;
  };

  getStockTransferRequestItemsByRequestId = async (
    { requestId },
    transaction = null,
    lock = null
  ) => {
    const items = await StockTransferRequestItem.findAll({
      where: { requestId },
      include: [
        {
          model: CaseLine,
          as: "caseline",
        },
      ],
      transaction,
      lock,
    });

    return items.map((item) => item.toJSON());
  };
}

export default StockTransferRequestItemRepository;
