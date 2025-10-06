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

    res.status(200).json({
      status: "sucess",
      data: {
        customer: existingCustomer,
      },
    });
  };
}

export default CustomerController;
