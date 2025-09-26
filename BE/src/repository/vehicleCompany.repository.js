const { VehicleCompany, VehicleModel } = require("../../models/index");

class VehicleCompanyRepository {
  async findAllCompaniesWithModels() {
    const vehicleCompanies = await VehicleCompany.findAll({
      include: {
        model: VehicleModel,
        as: "models",
      },
    });

    return vehicleCompanies;
  }

  async createCompany({ name, address, phone, email }) {
    const newCompany = await VehicleCompany.create({
      name,
      address,
      phone,
      email,
    });

    return newCompany;
  }

  async findVehicleCompanyWithId({ id }) {
    const existingVehicleCompany = await VehicleCompany.findByPk(id);

    return existingVehicleCompany;
  }
}

module.exports = new VehicleCompanyRepository();
