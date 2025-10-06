import db from "../../models/index.cjs";

const { ServiceCenter, VehicleCompany } = db;

class ServiceCenterRepository {
  findServiceCenterWithId = async ({ serviceCenterId }) => {
    const company = await ServiceCenter.findOne({
      where: {
        serviceCenterId: serviceCenterId,
      },

      attributes: [],

      include: [
        {
          model: VehicleCompany,
          as: "vehicleCompany",
          attributes: ["vehicle_company_id"],
        },
      ],
    });

    return company.toJSON();
  };
}

export default ServiceCenterRepository;
