const UserService = require("../service/User.service.js");
const VehicleService = require("../service/vehicle.service.js");
const CustomerService = require("../service/customer.service.js");

class VehicleController {
  constructor() {
    this.userService = UserService;
    this.vehicleService = VehicleService;
    this.customerService = CustomerService;
  }

  registerVehicleWithCustomer = async (req, res) => {
    try {
      const { customer, licensePlate, purchaseDate } = req.body;
      const { vin } = req.params;

      const newCustomer = await this.customerService.createCustomer(customer);

      const ownerId = newCustomer.id;

      console.log(vin, licensePlate, purchaseDate, ownerId);

      const updatedVehicle =
        await this.vehicleService.registerVehicleWithCustomer({
          vin,
          licensePlate,
          purchaseDate,
          ownerId,
        });

      res.status(200).json({
        status: "success",
        data: {
          updatedVehicle,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      }

      res.status(500).json({
        status: "fail",
        message: `Server error: ${error.message}`,
      });
    }
  };

  findVehicleByVin = async (req, res) => {
    try {
      const result = await this.vehicleService.findVehicleByVin(req.body);

      res.status(200).json({
        status: "success",
        data: {
          result,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      }

      res.status(500).json({
        status: "fail",
        message: `Server error: ${error.message}`,
      });
    }
  };
}

module.exports = new VehicleController();
