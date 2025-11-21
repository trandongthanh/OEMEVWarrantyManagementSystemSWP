import db from "../models/index.cjs";

const { ComponentHistory } = db;

class ComponentHistoryRepository {
  bulkCreate = async (historyRecords, transaction = null) => {
    const newHistories = await ComponentHistory.bulkCreate(historyRecords, {
      transaction,
    });
    return newHistories.map((h) => h.toJSON());
  };
}

export default ComponentHistoryRepository;
