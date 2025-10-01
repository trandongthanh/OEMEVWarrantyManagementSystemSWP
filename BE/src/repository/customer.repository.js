import { Op } from "sequelize";
import db from "../../models/index.cjs";
const { Customer } = db;

class CustomerRepository {
  findCustomerByPhoneOrEmail = async ({ phone, email }, option = null) => {
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [{ phone: phone }, { email: email }],
      },
      transaction: option,
    });

    if (!existingCustomer) {
      return null;
    }

    return existingCustomer.toJSON();
  };

  createCustomer = async (
    { fullName, email, phone, address },
    option = null
  ) => {
    const newCustomer = await Customer.create(
      {
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
      },
      { transaction: option }
    );

    return newCustomer.toJSON();
  };

  findCustomerById = async ({ id }, option = null) => {
    const existingCustomer = await Customer.findOne({
      where: {
        id: id,
      },

      transaction: option,
    });

    if (!existingCustomer) {
      return null;
    }

    return existingCustomer.toJSON();
  };
}

export default CustomerRepository;
