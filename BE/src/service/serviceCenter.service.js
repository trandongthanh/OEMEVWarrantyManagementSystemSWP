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
      await this.serviceCenterRepository.findServiceCenterWithId({
        serviceCenterId: serviceCenterId,
      });

    const company = serviceCenter.vehicleCompany;

    return company;
  };
}

export default ServiceCenterService;
