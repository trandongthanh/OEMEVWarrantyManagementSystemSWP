import { BadRequestError, NotFoundError } from "../error/index.js";

class ServiceCenterService {
  #serviceCenterRepository;
  constructor({ serviceCenterRepository }) {
    this.#serviceCenterRepository = serviceCenterRepository;
  }

  findServiceCenterById = async ({ serviceCenterId }) => {
    if (!serviceCenterId) {
      throw new BadRequestError("ServiceCenterId is required");
    }

    const serviceCenter =
      await this.#serviceCenterRepository.findServiceCenterById({
        serviceCenterId: serviceCenterId,
      });

    return serviceCenter;
  };

  findCompanyByServiceCenterId = async ({ serviceCenterId }) => {
    if (!serviceCenterId) {
      throw new BadRequestError("ServiceCenterId is required");
    }

    const company =
      await this.#serviceCenterRepository.findCompanyByServiceCenterId({
        serviceCenterId: serviceCenterId,
      });

    return company;
  };

  updateMaxActiveTasksPerTechnician = async ({
    serviceCenterId,
    maxActiveTasksPerTechnician,
  }) => {
    if (!serviceCenterId) {
      throw new BadRequestError("ServiceCenterId is required");
    }

    const serviceCenter =
      await this.#serviceCenterRepository.findServiceCenterById({
        serviceCenterId,
      });

    if (!serviceCenter) {
      throw new NotFoundError("Service center not found");
    }

    const updatedServiceCenter =
      await this.#serviceCenterRepository.updateServiceCenter({
        serviceCenterId,
        updateData: { maxActiveTasksPerTechnician },
      });

    return updatedServiceCenter;
  };
}

export default ServiceCenterService;
