// seeder.cjs
const { faker } = require("@faker-js/faker");
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");

const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];

// Import tất cả các model cần thiết
const {
  VehicleCompany,
  VehicleModel,
  Vehicle,
  ServiceCenter,
  TypeComponent,
  ComponentCompany,
  TypeComponentByCompany,
  WarrantyComponent,
  User,
  Role,
} = require("../models/index.cjs");

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

    // Tạm thời tắt kiểm tra khóa ngoại để việc xóa diễn ra suôn sẻ
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", null);

    // Xóa dữ liệu trong tất cả các bảng (dùng destroy() không có truncate)
    // Thứ tự xóa: Bảng con -> Bảng cha
    await User.destroy({ where: {} });
    await Role.destroy({ where: {} });
    await ServiceCenter.destroy({ where: {} });
    await Vehicle.destroy({ where: {} });
    await WarrantyComponent.destroy({ where: {} });
    await TypeComponentByCompany.destroy({ where: {} });
    await ComponentCompany.destroy({ where: {} });
    await TypeComponent.destroy({ where: {} });
    await VehicleModel.destroy({ where: {} });
    await VehicleCompany.destroy({ where: {} });

    // Bật lại kiểm tra khóa ngoại
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", null);

    // --- 1. SEED ENTITIES WITHOUT DEPENDENCIES ---
    console.log("🌱 Seeding Vehicle Companies...");
    const companyData = [
      {
        name: "Tesla",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "VinFast",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "BYD",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "Hyundai",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "Ford",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
    ];
    const createdCompanies = await VehicleCompany.bulkCreate(companyData, {
      returning: true,
    });
    console.log(`✅ Created ${createdCompanies.length} companies.`);

    console.log("🌱 Seeding Component Suppliers...");
    const supplierData = [
      {
        name: "Bosch",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "LG Energy Solution",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "CATL",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "Michelin",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
      {
        name: "ZF Friedrichshafen",
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
    ];
    const createdSuppliers = await ComponentCompany.bulkCreate(supplierData, {
      returning: true,
    });
    console.log(`✅ Created ${createdSuppliers.length} component suppliers.`);

    console.log("🌱 Seeding Component Types...");
    const typeComponentData = [
      {
        name: "Pin Cao áp (EV Battery)",
        price: faker.commerce.price({ min: 5000, max: 10000 }),
      },
      {
        name: "Ắc quy 12V (12V Battery)",
        price: faker.commerce.price({ min: 100, max: 200 }),
      },
      {
        name: "Động cơ điện (Electric Motor)",
        price: faker.commerce.price({ min: 3000, max: 7000 }),
      },
      {
        name: "Hệ thống phanh (Braking System)",
        price: faker.commerce.price({ min: 500, max: 1500 }),
      },
    ];
    const createdTypeComponents = await TypeComponent.bulkCreate(
      typeComponentData,
      { returning: true }
    );
    console.log(`✅ Created ${createdTypeComponents.length} component types.`);

    console.log("🌱 Seeding Roles...");
    const roles = [
      { roleName: "service_center_staff" },
      { roleName: "service_center_technician" },
      { roleName: "emv_staff" },
      { roleName: "emv_admin" },
    ];
    const createdRoles = await Role.bulkCreate(roles, { returning: true });
    console.log(`✅ Created ${createdRoles.length} roles.`);

    // --- 2. SEED ENTITIES THAT DEPEND ON THE ABOVE ---
    console.log("🌱 Seeding Service Centers...");
    const serviceCenters = [];
    createdCompanies.forEach((company) => {
      for (let i = 0; i < 5; i++) {
        serviceCenters.push({
          name: `${company.name} Service ${faker.location.city()}`,
          address: faker.location.streetAddress(true),
          phone: faker.phone.number(),
          vehicleCompanyId: company.vehicleCompanyId,
        });
      }
    });
    const createdServiceCenters = await ServiceCenter.bulkCreate(
      serviceCenters,
      { returning: true }
    );
    console.log(`✅ Created ${createdServiceCenters.length} service centers.`);

    console.log("🌱 Seeding Vehicle Models...");
    const modelData = {
      Tesla: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck"],
      VinFast: ["VF 5", "VF 6", "VF 7", "VF 8", "VF 9", "VF 3"],
      BYD: ["Dolphin", "Seal", "Atto 3", "Han", "Tang"],
      Hyundai: ["Ioniq 5", "Ioniq 6", "Kona Electric"],
      Ford: ["Mustang Mach-E", "F-150 Lightning"],
    };
    const models = [];
    createdCompanies.forEach((company) => {
      const companyModels = modelData[company.name] || [faker.vehicle.model()];
      companyModels.forEach((modelName) => {
        models.push({
          vehicleModelName: modelName,
          yearOfLaunch: faker.date.past({ years: 5 }),
          generalWarrantyDuration: faker.helpers.arrayElement([36, 60, 84]),
          generalWarrantyMileage: faker.helpers.arrayElement([
            50000, 100000, 150000,
          ]),
          vehicleCompanyId: company.vehicleCompanyId,
        });
      });
    });
    const createdModels = await VehicleModel.bulkCreate(models, {
      returning: true,
    });
    console.log(`✅ Created ${createdModels.length} models.`);

    // --- 3. SEED USERS (DEPENDS ON ROLES, SERVICE CENTERS, COMPANIES) ---
    console.log("🌱 Seeding Users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const vinfastCompany = createdCompanies.find((c) => c.name === "VinFast");
    const teslaServiceCenter = createdServiceCenters.find((sc) =>
      sc.name.includes("Tesla")
    );

    // ...
    const users = [
      {
        username: "staff01",
        name: faker.person.fullName(),
        password: hashedPassword,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        roleId: createdRoles.find((r) => r.roleName === "service_center_staff")
          .roleId,
        serviceCenterId: teslaServiceCenter?.serviceCenterId || null,
        vehicleCompanyId: null,
      },
      {
        username: "technician01",
        name: faker.person.fullName(),
        password: hashedPassword,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        roleId: createdRoles.find(
          (r) => r.roleName === "service_center_technician"
        ).roleId,
        serviceCenterId: teslaServiceCenter?.serviceCenterId || null,
        vehicleCompanyId: null,
      },
      {
        username: "emvstaff01",
        name: faker.person.fullName(),
        password: hashedPassword,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        roleId: createdRoles.find((r) => r.roleName === "emv_staff").roleId,
        serviceCenterId: null,
        vehicleCompanyId: vinfastCompany?.vehicleCompanyId || null,
      },
      {
        username: "admin01",
        name: faker.person.fullName(),
        password: hashedPassword,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        roleId: createdRoles.find((r) => r.roleName === "emv_admin").roleId,
        serviceCenterId: null,
        vehicleCompanyId: vinfastCompany?.vehicleCompanyId || null,
      },
      // --- USER CỦA BẠN ---
      {
        username: "thanhtd",
        name: "Trần Đông Thạnh",
        password: hashedPassword,
        email: "thanh.tran@email.com",
        phone: "0912345678",
        address: "123 Đường ABC, Q1, TP.HCM",
        roleId: createdRoles.find((r) => r.roleName === "service_center_staff")
          .roleId,
        serviceCenterId: teslaServiceCenter?.serviceCenterId || null,
        vehicleCompanyId: null,
      },
    ];

    await User.bulkCreate(users);
    console.log(
      `✅ Created ${users.length} users. Default password for all is "password123"`
    );

    // --- 4. SEED JOIN TABLES (M-N RELATIONSHIPS) ---
    console.log(
      "🌱 Seeding M-N relationship for TypeComponent and ComponentCompany..."
    );
    const typeComponentSupplierLinks = [];
    createdTypeComponents.forEach((type) => {
      const randomSuppliers = faker.helpers.arrayElements(createdSuppliers, {
        min: 1,
        max: 2,
      });
      randomSuppliers.forEach((supplier) => {
        typeComponentSupplierLinks.push({
          typeComponentId: type.typeComponentId,
          componentCompanyId: supplier.componentCompanyId,
        });
      });
    });
    await TypeComponentByCompany.bulkCreate(typeComponentSupplierLinks);
    console.log(
      `✅ Created ${typeComponentSupplierLinks.length} component-supplier links.`
    );

    console.log(
      "🌱 Seeding specific component warranties (Battery & 12V Battery)..."
    );
    const warrantyComponents = [];
    const evBatteryType = createdTypeComponents.find((c) =>
      c.name.includes("Pin Cao áp")
    );
    const twelveVoltBatteryType = createdTypeComponents.find((c) =>
      c.name.includes("Ắc quy 12V")
    );

    if (evBatteryType && twelveVoltBatteryType) {
      createdModels.forEach((model) => {
        warrantyComponents.push({
          vehicleModelId: model.vehicleModelId,
          typeComponentId: evBatteryType.typeComponentId,
          quantity: 1,
          durationMonth: 96, // 8 năm = 96 tháng
          mileageLimit: 160000,
        });
        warrantyComponents.push({
          vehicleModelId: model.vehicleModelId,
          typeComponentId: twelveVoltBatteryType.typeComponentId,
          quantity: 1,
          durationMonth: 12, // 1 năm = 12 tháng
          mileageLimit: 20000,
        });
      });
    }
    await WarrantyComponent.bulkCreate(warrantyComponents);
    console.log(
      `✅ Created ${warrantyComponents.length} specific component warranties.`
    );

    // --- 5. SEED FINAL DATA ---
    console.log("🌱 Seeding vehicles...");
    const vehicles = [];
    createdModels.forEach((model) => {
      for (let i = 0; i < 10; i++) {
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

    console.log("\n🎉 Seeding finished successfully!");
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

generateData();
