class VehicleController {
  #vehicleService;
  constructor({ vehicleService }) {
    this.#vehicleService = vehicleService;
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
}

export default VehicleController;
