import db from "../../models/index.cjs";

const { GuaranteeCase } = db;

class GuaranteeCaseRepository {
  createGuaranteeCases = async ({ guaranteeCases }, option = null) => {
    const newGuaranteeCases = await GuaranteeCase.bulkCreate(guaranteeCases, {
      transaction: option,
    });

    return newGuaranteeCases.map((item) => item.toJSON());
  };

  updateMainTechnician = async (
    { vehicleProcessingRecordId, technicianId },
    option = null
  ) => {
    const rowEffect = await GuaranteeCase.update(
      {
        leadTechId: technicianId,
      },
      {
        where: {
          vehicleProcessingRecordId: vehicleProcessingRecordId,
        },
        transaction: option,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedGuaranteeCases = await GuaranteeCase.findAll({
      where: {
        vehicleProcessingRecordId: vehicleProcessingRecordId,
      },
      transaction: option,
    });

    return updatedGuaranteeCases.map((updatedGuaranteeCase) =>
      updatedGuaranteeCase.toJSON()
    );
  };
}

export default GuaranteeCaseRepository;
