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

  findCustomerById = async ({ id }, option = null) => {
    const existingCustomer = await Customer.findOne({
      where: {
        id: id,
      },

      attributes: ["id"],

      transaction: option,
    });

    if (!existingCustomer) {
      return null;
    }

    return existingCustomer.toJSON();
  };
}

export default CustomerRepository;
