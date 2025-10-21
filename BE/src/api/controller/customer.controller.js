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
}

export default CustomerController;
