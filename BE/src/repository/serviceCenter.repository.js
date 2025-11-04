import db from "../models/index.cjs";

const { ServiceCenter, VehicleCompany } = db;

class ServiceCenterRepository {
  findServiceCenterWithId = async ({ serviceCenterId }) => {
    const serviceCenter = await ServiceCenter.findOne({
      where: {
        serviceCenterId: serviceCenterId,
      },

      include: [
        {
          model: VehicleCompany,
          as: "vehicleCompany",
          attributes: ["vehicle_company_id"],
        },
      ],
    });

    if (!serviceCenter) {
      return null;
    }

    return serviceCenter.toJSON();
  };

  async findServiceCenterById(
    { serviceCenterId },
    transaction = null,
    lock = null
  ) {
    const serviceCenter = await ServiceCenter.findByPk(serviceCenterId, {
      transaction,
      lock,
    });
    return serviceCenter ? serviceCenter.toJSON() : null;
  }

  async updateServiceCenter(
    { serviceCenterId, updateData },
    transaction = null
  ) {
    const [numberOfAffectedRows] = await ServiceCenter.update(updateData, {
      where: { serviceCenterId },
      transaction,
    });

    if (numberOfAffectedRows === 0) {
      return null;
    }

    const updatedServiceCenter = await ServiceCenter.findByPk(serviceCenterId, {
      transaction,
    });

    return updatedServiceCenter ? updatedServiceCenter.toJSON() : null;
  }
}

export default ServiceCenterRepository;
