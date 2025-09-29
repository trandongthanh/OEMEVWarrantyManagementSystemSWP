import { BadRequestError } from "../error/index.js";

class ServiceCenterService {
  constructor({ serviceCenterRepository }) {
    this.serviceCenterRepository = serviceCenterRepository;
  }

  findCompanyWithServiceCenterId = async ({ serviceCenterId }) => {
    if (!serviceCenterId) {
      throw new BadRequestError("ServiceCenterId is required");
    }

    const serviceCenter =
      await this.serviceCenterRepository.findCompanyWithServiceCenterId({
        serviceCenterId: serviceCenterId,
      });

    const company = serviceCenter.dataValues.vehicleCompany;

    return company;
  };
}

export default ServiceCenterService;
