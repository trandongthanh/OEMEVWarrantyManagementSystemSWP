import { where } from "sequelize";
import db from "../models/index.cjs";

const { GuaranteeCase, VehicleProcessingRecord, Vehicle, User } = db;

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

      include: [
        {
          model: User,
          as: "leadTechnicianCases",
          attributes: ["userId", "name"],
        },
      ],

      transaction: option,
    });

    if (!updatedGuaranteeCases) {
      return null;
    }

    return updatedGuaranteeCases.map((updatedGuaranteeCase) =>
      updatedGuaranteeCase.toJSON()
    );
  };

  validateGuaranteeCase = async ({ guaranteeCaseId }, option = null) => {
    const existingGuaranteeCase = await GuaranteeCase.findByPk(
      guaranteeCaseId,
      {
        transaction: option,
        attributes: ["leadTechId", "status"],
        include: [
          {
            model: VehicleProcessingRecord,
            as: "vehicleProcessingRecord",
            attributes: ["vehicleProcessingRecordId"],

            include: [
              {
                model: Vehicle,
                as: "vehicle",
                attributes: ["vehicleModelId"],
              },
            ],
          },
        ],
      }
    );

    if (!existingGuaranteeCase) {
      return null;
    }

    return existingGuaranteeCase.toJSON();
  };

  updateStatus = async ({ guaranteeCaseId, status }, option = null) => {
    const rowEffect = await GuaranteeCase.update(
      { status },
      {
        where: { guaranteeCaseId: guaranteeCaseId },
        returning: true,
        transaction: option,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedGuaranteeCase = await GuaranteeCase.findByPk(guaranteeCaseId, {
      transaction: option,
    });

    if (!updatedGuaranteeCase) {
      return null;
    }

    return updatedGuaranteeCase.toJSON();
  };

  findById = async ({ guaranteeCaseId }, option = null) => {
    const existingGuaranteeCase = await GuaranteeCase.findByPk(
      guaranteeCaseId,
      {
        transaction: option,
      }
    );

    if (!existingGuaranteeCase) {
      return null;
    }

    return existingGuaranteeCase.toJSON();
  };
}

export default GuaranteeCaseRepository;
