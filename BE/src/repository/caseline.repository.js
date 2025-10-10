import db from "../models/index.cjs";

const { CaseLine } = db;

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
}

export default CaseLineRepository;
