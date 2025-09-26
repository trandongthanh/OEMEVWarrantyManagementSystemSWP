const { NotFoundError, BadRequestError } = require("../error");
const VehicleCompanyRepository = require("../repository/vehicleCompany.repository");

class VehicleCompanyService {
  constructor() {
    this.vehicleCompanyRepository = VehicleCompanyRepository;
  }

  findAllCompaniessWithModels = async () => {
    const companies =
      await this.vehicleCompanyRepository.findAllCompaniesWithModels();

    if (!companies) {
      throw new NotFoundError("Not company exist");
    }

    return companies;
  };

  createVehicleCompany = async (vehicleCompanyData) => {
    const { name, address, phone, email } = vehicleCompanyData;

    if (!name || !address || !phone || !email) {
      throw new BadRequestError("name, address, phone and email is required");
    }

    const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validatePhone = /^\d{10}$/;

    if (!validateEmail.test(email) || !validatePhone.test(phone)) {
      throw new BadRequestError("Email or phone is false format");
    }

    const newCompany = await this.vehicleCompanyRepository.createCompany({
      name,
      address,
      phone,
      email,
    });

    return newCompany;
  };

  findVehicleCompanyWithId = async (vehicleCompanyData) => {
    const { id } = vehicleCompanyData;

    if (!id) {
      throw new BadRequestError("Id cannot null");
    }

    const newVehicleCompany =
      await this.vehicleCompanyRepository.findVehicleCompanyWithId({ id: id });

    return newVehicleCompany;
  };
}

module.exports = new VehicleCompanyService();
