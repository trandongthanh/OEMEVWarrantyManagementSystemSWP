class CustomerController {
  constructor({ customerService }) {
    this.customerService = customerService;
  }

  findCustomerByPhoneOrEmail = async (req, res, next) => {
    let { phone, email } = req.query;

    const existingCustomer =
      await this.customerService.findCustomerByPhoneOrEmail({
        phone: phone,
        email: email,
      });

    if (!existingCustomer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer is not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        customer: existingCustomer,
      },
    });
  };

  updateCustomerInfo = async (req, res, next) => {
    const { id } = req.params;
    const customerData = req.body;

    const updatedCustomer = await this.customerService.updateCustomerInfo(
      id,
      customerData
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        customer: updatedCustomer,
      },
    });
  };

  getAllCustomer = async (req, res, next) => {
    const customers = await this.customerService.getAllCustomer();

    res.status(200).json({
      status: "success",
      data: {
        customers: customers,
      },
    });
  };
}

export default CustomerController;
