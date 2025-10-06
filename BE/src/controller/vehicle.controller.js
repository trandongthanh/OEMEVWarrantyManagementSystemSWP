import { BadRequestError } from "../error/index.js";

class VehicleController {
  constructor({ vehicleService, serviceCenterService, customerService }) {
    this.vehicleService = vehicleService;
    this.serviceCenterService = serviceCenterService;
    this.customerService = customerService;
  }

  findVehicleByVin = async (req, res, next) => {
    const { vin } = req.params;

    const { companyId } = req;

    const vehicle = await this.vehicleService.findVehicleByVin({
      vehicleVin: vin,
      companyId: companyId,
    });

    if (!vehicle) {
      return res.status(404).json({
        status: "success",
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

  registerCustomerForVehicle = async (req, res, next) => {
    const {
      customer,
      customerId: ownerId,
      dateOfManufacture,
      licensePlate,
      purchaseDate,
    } = req.body;

    const { vin } = req.params;

    const { companyId } = req;

    const updatedVehicle = await this.vehicleService.registerOwnerForVehicle({
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
      data: {
        vehicle: updatedVehicle,
      },
    });
  };

  findVehicleByVinWithWarranty = async (req, res, next) => {
    const { vin } = req.params;

    const { serviceCenterId } = req.user;

    const { odometer } = req.body;

    const company =
      await this.serviceCenterService.findCompanyWithServiceCenterId({
        serviceCenterId: serviceCenterId,
      });

    const vehicleCompanyId = company.vehicle_company_id;

    const existingVehicle =
      await this.vehicleService.findVehicleByVinWithWarranty({
        vin: vin,
        companyId: vehicleCompanyId,
        odermeodometerter: odometer,
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
        result: existingVehicle,
      },
    });
  };
}

export default VehicleController;
