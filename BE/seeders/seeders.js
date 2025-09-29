// seeder.js
const { faker } = require("@faker-js/faker");
const { Sequelize } = require("sequelize");

// IMPORTANT: Import your models here
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];

// Bổ sung ServiceCenter vào đây
const {
  VehicleCompany,
  VehicleModel,
  Vehicle,
  ServiceCenter,
} = require("../models/index.cjs");

// --- DATABASE CONNECTION ---
let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const generateData = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");

    // --- GENERATE VEHICLE COMPANIES ---
    console.log("🌱 Seeding vehicle companies...");
    const companies = [];
    for (let i = 0; i < 3; i++) {
      companies.push({
        name: faker.vehicle.manufacturer(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      });
    }
    const createdCompanies = await VehicleCompany.bulkCreate(companies, {
      returning: true,
    });
    console.log(`✅ Created ${createdCompanies.length} companies.`);

    // --- GENERATE VEHICLE MODELS ---
    console.log("🌱 Seeding vehicle models...");
    const models = [];
    createdCompanies.forEach((company) => {
      for (let i = 0; i < faker.number.int({ min: 2, max: 3 }); i++) {
        models.push({
          vehicleModelName: faker.vehicle.model(),
          yearOfLaunch: faker.date.past({ years: 10 }),
          vehicleCompanyId: company.vehicleCompanyId,
        });
      }
    });
    const createdModels = await VehicleModel.bulkCreate(models, {
      returning: true,
    });
    console.log(`✅ Created ${createdModels.length} models.`);

    // --- (PHẦN MỚI) GENERATE SERVICE CENTERS ---
    console.log("🌱 Seeding service centers...");
    const serviceCenters = [];
    createdCompanies.forEach((company) => {
      // Tạo 3-5 trung tâm cho mỗi hãng xe
      for (let i = 0; i < faker.number.int({ min: 3, max: 5 }); i++) {
        serviceCenters.push({
          name: `${company.name} Service ${faker.location.city()}`,
          address: faker.location.streetAddress(true),
          phone: faker.phone.number(),
          // Gán khóa ngoại để biết trung tâm này thuộc hãng nào
          vehicleCompanyId: company.vehicleCompanyId,
        });
      }
    });
    const createdServiceCenters = await ServiceCenter.bulkCreate(
      serviceCenters,
      {
        returning: true,
      }
    );
    console.log(`✅ Created ${createdServiceCenters.length} service centers.`);
    // --- (KẾT THÚC PHẦN MỚI) ---

    // --- GENERATE PRE-SEEDED VEHICLES ---
    console.log("🌱 Seeding vehicles (pre-seeded state)...");
    const vehicles = [];
    createdModels.forEach((model) => {
      for (let i = 0; i < faker.number.int({ min: 50, max: 100 }); i++) {
        vehicles.push({
          vin: faker.vehicle.vin(),
          dateOfManufacture: faker.date.between({
            from: model.yearOfLaunch,
            to: new Date(),
          }),
          placeOfManufacture: faker.location.city(),
          vehicleModelId: model.vehicleModelId,
          licensePlate: null,
          ownerId: null,
          purchaseDate: null,
        });
      }
    });
    await Vehicle.bulkCreate(vehicles, { ignoreDuplicates: true });
    console.log(`✅ Created ${vehicles.length} vehicles.`);

    console.log("🎉 Seeding finished successfully!");
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

generateData();
