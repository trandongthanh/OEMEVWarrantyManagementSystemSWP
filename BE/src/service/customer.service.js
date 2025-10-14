import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";

class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
  }

  checkduplicateCustomer = async ({ phone, email }, option = null) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const existingCustomer =
      await this.customerRepository.findCustomerByPhoneOrEmail(
        {
          phone: phone,
          email: email,
        },
        option
      );

    if (existingCustomer) {
      throw new ConflictError("Customer is already in system");
    }
  };

  findCustomerByPhoneOrEmail = async ({ phone, email }, option = null) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const existingCustomer =
      await this.customerRepository.findCustomerByPhoneOrEmail(
        {
          phone: phone,
          email: email,
        },
        option
      );

    return existingCustomer;
  };

  createCustomer = async (
    { fullName, email, phone, address },
    option = null
  ) => {
    if (!fullName || !email || !phone || !address) {
      throw new BadRequestError(
        "fullName, email, phone and address is required"
      );
    }

    const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validatePhone = /^\d{11}$/;

    if (!validateEmail.test(email) || !validatePhone.test(phone)) {
      throw new BadRequestError("Email or phone is wrong format");
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

    return newCustomer;
  };

  checkExistCustomerById = async ({ id }, option = null) => {
    if (!id) {
      throw new BadRequestError(
        "Client must provide customerId to find customer"
      );
    }

    const existingCustomer = await this.customerRepository.findCustomerById(
      {
        id: id,
      },
      option
    );

    if (!existingCustomer) {
      throw new NotFoundError("Cannot find customer with this id");
    }

    return existingCustomer;
  };
}

export default CustomerService;
