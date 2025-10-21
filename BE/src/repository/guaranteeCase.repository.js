import { where } from "sequelize";
import db from "../models/index.cjs";

const { GuaranteeCase, VehicleProcessingRecord, Vehicle, User } = db;

class GuaranteeCaseRepository {
  createGuaranteeCases = async ({ guaranteeCases }, transaction = null) => {
    const newGuaranteeCases = await GuaranteeCase.bulkCreate(guaranteeCases, {
      transaction: transaction,
    });

    return newGuaranteeCases.map((item) => item.toJSON());
  };

  findByRecordId = async (
    { vehicleProcessingRecordId },
    transaction = null,
    lock = null
  ) => {
    const guaranteeCases = await GuaranteeCase.findAll({
      where: { vehicleProcessingRecordId },
      transaction,
      lock,
    });

    return guaranteeCases.map((gc) => gc.toJSON());
  };

  updateMainTechnician = async (
    { vehicleProcessingRecordId, technicianId },
    transaction = null
  ) => {
    const [affectedRows] = await GuaranteeCase.update(
      {
        leadTechId: technicianId,
      },
      {
        where: {
          vehicleProcessingRecordId: vehicleProcessingRecordId,
        },

        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return affectedRows;
    }

    const updatedGuaranteeCases = await this.findByRecordId(
      { vehicleProcessingRecordId },
      transaction
    );

    return updatedGuaranteeCases.map((gc) => gc);
  };

  findDetailById = async ({ guaranteeCaseId }, transaction = null) => {
    const existingGuaranteeCase = await GuaranteeCase.findByPk(
      guaranteeCaseId,
      {
        transaction: transaction,
        attributes: ["leadTechId", "status"],
        include: [
          {
            model: VehicleProcessingRecord,
            as: "vehicleProcessingRecord",
            attributes: ["vehicleProcessingRecordId", "odometer"],

            include: [
              {
                model: Vehicle,
                as: "vehicle",
                attributes: ["vin", "vehicleModelId"],
              },
              {
                model: User,
                as: "createdByStaff",
                attributes: ["userId", "name", "serviceCenterId"],
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
