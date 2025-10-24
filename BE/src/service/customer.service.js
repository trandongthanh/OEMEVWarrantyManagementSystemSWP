import { Transaction } from "sequelize";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";
import db from "../models/index.cjs";
import createCustomerSchema from "../validators/createCustomer.validator.js";

class CustomerService {
  #customerRepository;
  constructor({ customerRepository }) {
    this.#customerRepository = customerRepository;
  }

  checkDuplicateCustomer = async ({ phone, email }, option = null) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const existingCustomer =
      await this.#customerRepository.findCustomerByPhoneOrEmail(
        [{ phone: phone }, { email: email }],
        option
      );

    if (existingCustomer) {
      throw new ConflictError("Email or phone is already use in system");
    }
  };

  findCustomerByPhoneOrEmail = async ({ phone, email }, option = null) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const whereCondition = [];

    if (phone) whereCondition.push({ phone: phone });
    if (email) whereCondition.push({ email: email });

    const existingCustomer =
      await this.#customerRepository.findCustomerByPhoneOrEmail(
        whereCondition,
        option
      );

    return existingCustomer;
  };

  createCustomer = async (
    { fullName, email, phone, address },
    option = null
  ) => {
    const { error } = createCustomerSchema.validate({
      fullName: fullName,
      email: email,
      phone: phone,
      address: address,
    });

    if (error) {
      throw new BadRequestError(
        `Validation error when create customer: ${error.message}`
      );
    }

    const isValidCustomer = await this.checkDuplicateCustomer(
      {
        phone: phone,
        email: email,
      },
      option
    );

    if (isValidCustomer) {
      throw new BadRequestError(
        `Customer already exists with this info ${phone} ${email}`
      );
    }

    const newCustomer = await this.#customerRepository.createCustomer(
      {
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
      },
      option
    );

    if (!newCustomer) {
      throw new BadRequestError("Failed to create customer");
    }

    return newCustomer;
  };

  updateCustomerInfo = async (id, customerData) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingCustomer = await this.#customerRepository.findCustomerById(
        { id: id },
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!existingCustomer) {
        throw new NotFoundError("Customer not found.");
      }

      const oldEmail = existingCustomer.email;
      const oldPhone = existingCustomer.phone;

      const isEmailChanged =
        customerData.email && customerData.email !== oldEmail;
      const isPhoneChanged =
        customerData.phone && customerData.phone !== oldPhone;

      if (isEmailChanged || isPhoneChanged) {
        const duplicateCheckData = {
          phone: isPhoneChanged ? customerData.phone : null,
          email: isEmailChanged ? customerData.email : null,
        };

        await this.checkDuplicateCustomer(duplicateCheckData, transaction);
      }

      const updatedCustomer =
        await this.#customerRepository.updateCustomerInfoById(
          id,
          customerData,
          transaction
        );

      if (!updatedCustomer) {
        throw new BadRequestError("Failed to update customer info.");
      }

      return updatedCustomer;
    });

    return rawResult;
  };

  checkExistCustomerById = async ({ id }, option = null, lock = null) => {
    if (!id) {
      throw new BadRequestError(
        "Client must provide customerId to find customer"
      );
    }

    const existingCustomer = await this.customerRepository.findCustomerById(
      {
        id: id,
      },
      option,
      lock
    );

    if (!existingCustomer) {
      return null;
    }

    return existingCustomer;
  };

  getAllCustomer = async () => {
    const customers = await this.#customerRepository.getAllCustomer();

    return customers;
  };
}

export default CustomerService;
