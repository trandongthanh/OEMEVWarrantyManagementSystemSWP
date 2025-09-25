const { Customer } = require("../../models/index");

class CustomerRepository {
  createCustomer = async ({ fullName, email, phone, address }) => {
    const newCustomer = await Customer.create({
      fullName,
      email,
      phone,
      address,
    });

    return newCustomer;
  };
}

module.exports = new CustomerRepository();
