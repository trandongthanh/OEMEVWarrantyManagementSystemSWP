import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";
import createCustomerSchema from "../validators/createCustomer.validator.js";

class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
  }

  checkDuplicateCustomer = async ({ phone, email }, option = null) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const existingCustomer =
      await this.customerRepository.findCustomerByPhoneOrEmail(
        [{ phone: phone }, { email: email }],
        option
      );

    if (existingCustomer) {
      throw new ConflictError("Customer is already in system");
    }

    if (existingCustomer) {
      return true;
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
      await this.customerRepository.findCustomerByPhoneOrEmail(
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

    const newCustomer = await this.customerRepository.createCustomer(
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
}

export default CustomerService;
