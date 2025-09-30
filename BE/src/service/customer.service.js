import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";

class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
  }

  checkduplicateCustomer = async ({ phone, email }) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const existingCustomer =
      await this.customerRepository.findCustomerByPhoneOrEmail({
        phone: phone,
        email: email,
      });

    if (existingCustomer) {
      throw new ConflictError("Customer is already in system");
    }
  };

  findCustomerByPhoneOrEmail = async ({ phone, email }) => {
    if (!phone && !email) {
      throw new BadRequestError(
        "Client must provide phone or email to customer"
      );
    }

    const existingCustomer =
      await this.customerRepository.findCustomerByPhoneOrEmail({
        phone: phone,
        email: email,
      });

    return existingCustomer;
  };

  createCustomer = async ({ fullName, email, phone, address }) => {
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

    const newCustomer = await this.customerRepository.createCustomer({
      fullName: fullName,
      email: email,
      phone: phone,
      address: address,
    });

    return newCustomer;
  };

  checkCustomerById = async ({ id }) => {
    if (!id) {
      throw new BadRequestError(
        "Client must provice customerId to find customer"
      );
    }

    const existingCustomer = await this.customerRepository.findCustomerById({
      id: id,
    });

    if (!existingCustomer) {
      throw new NotFoundError("Cannot find customer with this id");
    }
  };
}

export default CustomerService;
