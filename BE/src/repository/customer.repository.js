import { Op } from "sequelize";
import db from "../../models/index.cjs";
const { Customer } = db;

class CustomerRepository {
  findCustomerByPhoneOrEmail = async ({ phone, email }) => {
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [{ phone: phone }, { email: email }],
      },
    });

    console.log("Customer exist: ", existingCustomer);

    return existingCustomer;
  };

  createCustomer = async ({ fullName, email, phone, address }) => {
    const newCustomer = await Customer.create({
      fullName: fullName,
      email: email,
      phone: phone,
      address: address,
    });

    return newCustomer;
  };

  findCustomerById = async ({ id }) => {
    const existingCustomer = await Customer.findByPk(id);

    return existingCustomer;
  };
}

export default CustomerRepository;
