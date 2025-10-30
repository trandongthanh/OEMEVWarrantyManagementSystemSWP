import { Op } from "sequelize";
import db from "../models/index.cjs";
const { Customer, Vehicle, VehicleModel } = db;

class CustomerRepository {
  findCustomerByPhoneOrEmail = async (whereCondition = [], option = null) => {
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: whereCondition,
      },

      attributes: ["id", "fullName", "email", "phone", "address"],

      include: [
        {
          model: Vehicle,
          as: "vehicles",
          attributes: ["vin", "licensePlate", "purchaseDate"],

          include: [
            {
              model: VehicleModel,
              as: "model",
              attributes: [["vehicle_model_name", "modelName"]],
            },
          ],
        },
      ],

      transaction: option,
    });

    if (!existingCustomer) {
      return null;
    }

    return existingCustomer.toJSON();
  };

  createCustomer = async (
    { fullName, email, phone, address },
    option = null,
    lock = null
  ) => {
    const newCustomer = await Customer.create(
      {
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
      },
      { transaction: option, lock: lock }
    );

    if (!newCustomer) {
      return null;
    }

    return newCustomer.toJSON();
  };

  updateCustomerInfoById = async (id, customerData, transaction = null) => {
    const [rowsUpdated] = await Customer.update(customerData, {
      where: { id: id },
      transaction: transaction,
    });

    if (rowsUpdated <= 0) {
      return null;
    }

    const updatedCustomer = await Customer.findByPk(id, {
      transaction: transaction,
    });

    if (!updatedCustomer) {
      return null;
    }

    return updatedCustomer.toJSON();
  };

  findCustomerById = async ({ id }, transaction = null, lock = null) => {
    const existingCustomer = await Customer.findOne({
      where: {
        id: id,
      },

      attributes: ["id", "phone", "email"],

      transaction: transaction,
      lock: lock,
    });

    if (!existingCustomer) {
      return null;
    }

    return existingCustomer.toJSON();
  };

  getAllCustomer = async () => {
    const customers = await Customer.findAll({
      attributes: ["id", "fullName", "email", "phone", "address"],
      include: [
        {
          model: Vehicle,
          as: "vehicles",
          attributes: ["vin", "licensePlate", "purchaseDate"],
          include: [
            {
              model: VehicleModel,
              as: "model",
              attributes: [["vehicle_model_name", "modelName"]],
            },
          ],
        },
      ],
    });

    return customers.map((customer) => customer.toJSON());
  };
}

export default CustomerRepository;
