const VehicleCompanyService = require("../service/vehicleCompany.service");

class VehicleCompanyController {
  constructor() {
    this.vehicleCompanyService = VehicleCompanyService;
  }

  findAllCompaniesWithModels = async (req, res) => {
    try {
      const result =
        await this.vehicleCompanyService.findAllCompaniessWithModels();

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

  createVehicleCompany = async (req, res) => {
    try {
      const result = await this.vehicleCompanyService.createVehicleCompany(
        req.body
      );

      res.status(201).json({
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
        message: error.message,
      });
    }
  };
}

module.exports = new VehicleCompanyController();
