import { BadRequestError } from "../error/index.js";

class VehicleController {
  constructor({ vehicleService, serviceCenterService, customerService }) {
    this.vehicleService = vehicleService;
    this.serviceCenterService = serviceCenterService;
    this.customerService = customerService;
  }

  findVehicleByVin = async (req, res, next) => {
    const { vin } = req.query;

    const { serviceCenterId, companyId: vehicleCompanyId } = req.user;

    let companyId;
    if (serviceCenterId) {
      const vehicleCompany =
        await this.serviceCenterService.findCompanyWithServiceCenterId({
          serviceCenterId: serviceCenterId,
        });

      companyId = vehicleCompany.dataValues.vehicle_company_id;
    } else if (vehicleCompanyId) {
      companyId = vehicleCompanyId;
    } else {
      throw new BadRequestError("Staff not belong to company");
    }

    const vehicle = await this.vehicleService.findVehicleByVin({
      vehicleVin: vin,
      companyId: companyId,
    });

    let result = vehicle;
    if (!vehicle) {
      result = {};
    }

    res.status(200).json({
      status: "success",
      data: {
        vehicle: result,
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

    console.log(ownerId);

    let customerId;
    if (ownerId) {
      await this.customerService.checkCustomerById({
        id: ownerId,
      });

      customerId = ownerId;
    } else if (customer) {
      await this.customerService.checkduplicateCustomer({
        phone: customer.phone,
        email: customer.email,
      });

      const newCustomer = await this.customerService.createCustomer(customer);

      console.log("newCustomer: ", newCustomer);

      customerId = newCustomer.dataValues.id;
    } else {
      throw new BadRequestError(
        "Client must provide customer or customerId to register for owner for vehicle"
      );
    }

    const company =
      await this.serviceCenterService.findCompanyWithServiceCenterId({
        serviceCenterId: req.user.serviceCenterId,
      });

    console.log("CompanId: ", company.dataValues.vehicle_company_id);

    const updatedVehicle = await this.vehicleService.registerOwnerForVehicle({
      companyId: company.dataValues.vehicle_company_id,
      vin: vin,
      customerId: customerId,
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
}

export default VehicleController;
