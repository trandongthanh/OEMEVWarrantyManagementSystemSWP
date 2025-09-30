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

      companyId = vehicleCompany.vehicle_company_id;
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

    let customerId;
    if (ownerId) {
      // Case 1: Use existing customer
      console.log('Using existing customer with ID:', ownerId);
      await this.customerService.checkCustomerById({
        id: ownerId,
      });

      customerId = ownerId;
    } else if (customer) {
      // Case 2: Create new customer
      console.log('Creating new customer:', customer);
      
      // Check if all customer fields are provided when creating new customer
      if (!customer.fullName || !customer.email || !customer.phone || !customer.address) {
        throw new BadRequestError("All customer fields are required: fullName, email, phone, address");
      }

      await this.customerService.checkduplicateCustomer({
        phone: customer.phone,
        email: customer.email,
      });

      const newCustomer = await this.customerService.createCustomer(customer);
      console.log('New customer created with ID:', newCustomer.dataValues.id);

      customerId = newCustomer.dataValues.id;
    } else {
      throw new BadRequestError(
        "Client must provide customer or customerId to register for owner for vehicle"
      );
    }

    // Validate vehicle fields
    if (!dateOfManufacture || !licensePlate || !purchaseDate) {
      throw new BadRequestError("All vehicle fields are required: dateOfManufacture, licensePlate, purchaseDate");
    }

    console.log('Vehicle fields - VIN:', vin);
    console.log('Vehicle fields - Date of Manufacture:', dateOfManufacture);
    console.log('Vehicle fields - License Plate:', licensePlate);
    console.log('Vehicle fields - Purchase Date:', purchaseDate);

    const company =
      await this.serviceCenterService.findCompanyWithServiceCenterId({
        serviceCenterId: req.user.serviceCenterId,
      });

    const updatedVehicle = await this.vehicleService.registerOwnerForVehicle({
      companyId: company.vehicle_company_id,
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

  findVehicleByVinWithWarranty = async (req, res, next) => {
    const { vin } = req.params;

    const { serviceCenterId } = req.user;

    const company =
      await this.serviceCenterService.findCompanyWithServiceCenterId({
        serviceCenterId: serviceCenterId,
      });

    const vehicleCompanyId = company.vehicle_company_id;

    const existingVehicle =
      await this.vehicleService.findVehicleByVinWithWarranty({
        vin: vin,
        companyId: vehicleCompanyId,
      });

    let result = existingVehicle;

    if (!existingVehicle) {
      result = {};
    }

    res.status(200).json({
      status: "success",
      data: {
        vehicle: result,
      },
    });
  };
}

export default VehicleController;
