const CustomerService = require("../service/customer.service");

class CustomerController {
  constructor() {
    this.customerService = CustomerService;
  }

  createCustomer = async (req, res) => {
    try {
      const result = await this.customerService.createCustomer(req.body);

      res.status(201).json({
        status: "success",
        data: {
          result,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.statusCode(error.statusCode).json({
          status: "error",
        });
      }

      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  };
}

module.exports = new CustomerController();
