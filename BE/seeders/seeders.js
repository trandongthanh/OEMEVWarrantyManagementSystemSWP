// seeder.js
const { faker } = require("@faker-js/faker");
const { Sequelize } = require("sequelize");

// IMPORTANT: Import your models here from your models/index.js file
// Make sure the path is correct
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const { VehicleCompany, VehicleModel, Vehicle } = require("../models/index");

// --- DATABASE CONNECTION (Configure this to match your project) ---

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
      // Create 2-3 models for each company
      for (let i = 0; i < faker.number.int({ min: 2, max: 3 }); i++) {
        models.push({
          vehicleModelName: faker.vehicle.model(),
          yearOfLaunch: faker.date.past({ years: 10 }),
          vehicleCompanyId: company.vehicleCompanyId, // Link to the company
        });
      }
    });
    const createdModels = await VehicleModel.bulkCreate(models, {
      returning: true,
    });
    console.log(`✅ Created ${createdModels.length} models.`);

    // --- GENERATE PRE-SEEDED VEHICLES ---
    console.log("🌱 Seeding vehicles (pre-seeded state)...");
    const vehicles = [];
    createdModels.forEach((model) => {
      // Create 50-100 vehicles for each model
      for (let i = 0; i < faker.number.int({ min: 50, max: 100 }); i++) {
        vehicles.push({
          vin: faker.vehicle.vin(),
          dateOfManufacture: faker.date.between({
            from: model.yearOfLaunch,
            to: new Date(),
          }),
          placeOfManufacture: faker.location.city(),
          vehicleModelId: model.vehicleModelId, // Link to the model
          // These fields are NULL as per our hybrid model
          licensePlate: null,
          ownerId: null,
          purchaseDate: null,
        });
      }
    });
    await Vehicle.bulkCreate(vehicles, { ignoreDuplicates: true }); // Ignore if a VIN somehow duplicates
    console.log(`✅ Created ${vehicles.length} vehicles.`);

    console.log("🎉 Seeding finished successfully!");
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

generateData();
