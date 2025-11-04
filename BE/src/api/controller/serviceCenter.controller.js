class ServiceCenterController {
  #serviceCenterService;
  constructor({ serviceCenterService }) {
    this.#serviceCenterService = serviceCenterService;
  }

  updateMaxActiveTasksPerTechnician = async (req, res, next) => {
    const { serviceCenterId } = req.params;
    const { maxActiveTasksPerTechnician } = req.body;

    const updatedServiceCenter =
      await this.#serviceCenterService.updateMaxActiveTasksPerTechnician({
        serviceCenterId,
        maxActiveTasksPerTechnician,
      });

    res.status(200).json({
      status: "success",
      message: "Max active tasks per technician updated successfully",
      data: { serviceCenter: updatedServiceCenter },
    });
  };

  getWorkloadConfig = async (req, res, next) => {
    const { serviceCenterId } = req.params;

    const serviceCenter =
      await this.#serviceCenterService.findServiceCenterById({
        serviceCenterId,
      });

    if (!serviceCenter) {
      return res.status(404).json({
        status: "fail",
        message: "Service center not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        maxActiveTasksPerTechnician: serviceCenter.maxActiveTasksPerTechnician,
      },
    });
  };
}

export default ServiceCenterController;
