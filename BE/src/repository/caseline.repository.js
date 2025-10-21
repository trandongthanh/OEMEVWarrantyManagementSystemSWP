import { Op } from "sequelize";
import db from "../models/index.cjs";

const { CaseLine, GuaranteeCase } = db;

class CaseLineRepository {
  bulkCreate = async ({ caselines }, option = null) => {
    const newCaseLines = await CaseLine.bulkCreate(caselines, {
      transaction: option,
    });

    if (!newCaseLines || newCaseLines.length === 0) {
      return [];
    }

    return newCaseLines.map((caseLine) => caseLine.toJSON());
  };

  bulkUpdateStatusByIds = async (
    { caseLineIds, status },
    transaction = null
  ) => {
    const [numberOfAffectedRows] = await CaseLine.update(
      { status: status },
      {
        where: {
          id: {
            [Op.in]: caseLineIds,
          },
        },
        transaction: transaction,
      }
    );

    return numberOfAffectedRows;
  };

  findById = async ({ caselineId }, transaction = null, lock = null) => {
    const caseLine = await CaseLine.findOne({
      where: { id: caselineId },
      transaction: transaction,
      lock: lock,
    });

    return caseLine ? caseLine.toJSON() : null;
  };
}

export default CaseLineRepository;
