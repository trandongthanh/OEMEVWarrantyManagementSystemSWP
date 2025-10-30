class VehicleController {
  #vehicleService;
  #vehicleProcessingRecordService;
  constructor({ vehicleService, vehicleProcessingRecordService }) {
    this.#vehicleService = vehicleService;
    this.#vehicleProcessingRecordService = vehicleProcessingRecordService;
  }

  getVehicle = async (req, res, next) => {
    const { vin } = req.params;

    const { companyId } = req;

    const vehicle = await this.#vehicleService.getVehicleProfile({
      vin: vin,
      companyId: companyId,
    });

    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: `Cannot find vehicle with this vin: ${vin}`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        vehicle: vehicle,
      },
    });
  };

  assignOwnerToVehicle = async (req, res, next) => {
    const {
      customer,
      customerId: ownerId,
      dateOfManufacture,
      licensePlate,
      purchaseDate,
    } = req.body;

    const { vin } = req.params;

    const { companyId } = req;

    const updatedVehicle = await this.#vehicleService.registerOwnerForVehicle({
      customer: customer,
      vin: vin,
      ownerId: ownerId,
      companyId: companyId,
      dateOfManufacture: dateOfManufacture,
      licensePlate: licensePlate,
      purchaseDate: purchaseDate,
    });

    res.status(200).json({
      status: "success",
      data: updatedVehicle,
    });
  };

  findVehicleByVinWithWarranty = async (req, res, next) => {
    const { vin } = req.params;

    const { companyId } = req;

    const { odometer } = req.query;

    const existingVehicle =
      await this.#vehicleService.findVehicleByVinWithWarranty({
        vin: vin,
        companyId: companyId,
        odometer: odometer,
      });

    if (!existingVehicle) {
      return res.status(404).json({
        status: "success",
        message: `Cannot check warranty for vehicle with this VIN: ${vin} because this vehicle don't have owner`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        vehicle: existingVehicle,
      },
    });
  };

  findVehicleByVinWithWarrantyPreview = async (req, res, next) => {
    const { vin } = req.params;

    const { companyId } = req;

    const { odometer, purchaseDate } = req.body;

    const vehicle =
      await this.#vehicleService.findVehicleByVinWithWarrantyPreview({
        vin: vin,
        companyId: companyId,
        odometer: odometer,
        purchaseDate: purchaseDate,
      });

    if (!vehicle) {
      return res.status(404).json({
        status: "success",
        message: `Cannot find vehicle with this VIN: ${vin}`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        vehicle: vehicle,
      },
    });
  };

  getVehicleComponents = async (req, res, next) => {
    try {
      const { vin } = req.params;
      const { status = "INSTALLED" } = req.query;
      const { companyId } = req;

      const componentsData = await this.#vehicleService.getVehicleComponents({
        vin,
        companyId,
        status: status,
      });

      if (!componentsData) {
        return res.status(404).json({
          status: "error",
          message: `Vehicle not found`,
        });
      }

      return res.status(200).json({
        status: "success",
        data: componentsData,
      });
    } catch (error) {
      next(error);
    }
  };

  getServiceHistory = async (req, res, next) => {
    try {
      const { vin } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const { companyId } = req;

      const serviceHistory =
        await this.#vehicleProcessingRecordService.getServiceHistory({
          vin,
          companyId,
          page: parseInt(page),
          limit: parseInt(limit),
          statusFilter: status,
        });

      if (!serviceHistory) {
        return res.status(404).json({
          status: "error",
          message: `Vehicle not found`,
        });
      }

      return res.status(200).json({
        status: "success",
        data: serviceHistory,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default VehicleController;
