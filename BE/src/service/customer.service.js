const CustomerRepository = require("../repository/customer.repository");

class CustomerService {
  constructor() {
    this.customerRepository = CustomerRepository;
  }

  createCustomer = async (customerData) => {
    const { fullName, email, phone, address } = customerData;

    const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validatePhone = /^\d{10}$/;

    if (!address || !fullName || !phone || !email) {
      throw new BadRequestError("fullName, email, phone, address is required");
    }

    if (!validateEmail.test(email) || !validatePhone.test(phone)) {
      throw new BadRequestError("Inappropriate email or phone");
    }

    const newCustomer = await this.customerRepository.createCustomer({
      fullName,
      email,
      phone,
      address,
    });

    return newCustomer;
  };
}

module.exports = new CustomerService();
