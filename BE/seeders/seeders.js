// seeder.cjs
const { faker } = require("@faker-js/faker");
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");

const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];

// Import tất cả các model bạn có
const {
  VehicleCompany,
  VehicleModel,
  Vehicle,
  ServiceCenter,
  TypeComponent,
  WarrantyComponent,
  User,
  Role,
  Warehouse,
  Stock,
  Customer,
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

    console.log("🔥 Resetting database...");

    // Tắt kiểm tra khóa ngoại để truncate
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { raw: true });

    const tableNames = await sequelize.getQueryInterface().showAllTables();
    for (const tableName of tableNames) {
      // Bỏ qua bảng SequelizeMeta dùng cho migrations
      if (String(tableName).toLowerCase() !== "sequelizemeta") {
        console.log(`- Truncating ${tableName}...`);
        await sequelize.query(`TRUNCATE TABLE \`${tableName}\``, { raw: true });
      }
    }

    // Bật lại kiểm tra khóa ngoại
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });
    console.log("✅ Database reset successfully.");

    // --- 1. SEED CORE DATA ---
    console.log("🌱 Seeding Core Data...");

    const createdCompany = await VehicleCompany.create({
      name: "VinFast",
      address: "Hải Phòng, Việt Nam",
      phone: faker.phone.number(),
      email: "info@vinfast.vn",
    });

    const createdRoles = await Role.bulkCreate(
      [
        { roleName: "service_center_staff" },
        { roleName: "service_center_manager" },
        { roleName: "service_center_technician" },
        { roleName: "emv_admin" },
      ],
      { returning: true }
    );

    const typeComponentData = [
      {
        name: "Bộ sạc trong xe 11kW",
        sku: "VF-OBC-11",
        price: 800,
        category: "CHARGING_SYSTEM",
      },
      {
        name: "Má phanh trước VF8",
        sku: "VF8-BRK-FRT",
        price: 150,
        category: "BRAKING",
      },
      {
        name: "Cảm biến ABS bánh sau",
        sku: "VF-ABS-SEN-R",
        price: 50,
        category: "BRAKING",
      },
      {
        name: "Giảm xóc trước",
        sku: "VF-SUS-FRT",
        price: 200,
        category: "SUSPENSION_STEERING",
      },
      {
        name: "Màn hình trung tâm 15.6 inch",
        sku: "VF-INF-15.6",
        price: 1200,
        category: "INFOTAINMENT_ADAS",
      },
      {
        name: "Ắc quy 12V",
        sku: "VF-BAT-12V",
        price: 120,
        category: "LOW_VOLTAGE_SYSTEM",
      },
    ];
    const createdTypeComponents = await TypeComponent.bulkCreate(
      typeComponentData,
      { returning: true }
    );

    console.log("✅ Seeded Core Data (Company, Roles, TypeComponents).");

    // --- 2. SEED LOCATIONS, PEOPLE & VEHICLE MODELS ---
    console.log("🌱 Seeding Locations, People & Vehicle Models...");

    const createdServiceCenters = await ServiceCenter.bulkCreate(
      [
        {
          name: "VinFast Thảo Điền",
          address: "12 Quốc Hương, Thảo Điền, TP. Thủ Đức",
          phone: faker.phone.number(),
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          name: "VinFast Long Biên",
          address: "Vincom Plaza Long Biên, Hà Nội",
          phone: faker.phone.number(),
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
      ],
      { returning: true }
    );

    // Kho tổng của hãng (không thuộc service center)
    const centralWarehouse = await Warehouse.create({
      name: "Tổng kho VinFast Việt Nam",
      address: "Hải Phòng",
      vehicleCompanyId: createdCompany.vehicleCompanyId,
    });

    // Tạo nhiều warehouse cho mỗi service center (ví dụ: 2 kho/SC)
    const perSCWarehousesPayload = createdServiceCenters.flatMap((sc) => [
      {
        name: `${sc.name} - Kho A`,
        address: `${sc.address} - Khu A`,
        serviceCenterId: sc.serviceCenterId,
      },
      {
        name: `${sc.name} - Kho B`,
        address: `${sc.address} - Khu B`,
        serviceCenterId: sc.serviceCenterId,
      },
    ]);

    const createdSCWarehouses = await Warehouse.bulkCreate(
      perSCWarehousesPayload,
      { returning: true }
    );

    const allWarehouses = [centralWarehouse, ...createdSCWarehouses];

    const hashedPassword = await bcrypt.hash("123456", 10);
    await User.bulkCreate(
      [
        {
          username: "admin-vinfast",
          name: "Admin Hãng",
          password: hashedPassword,
          email: "admin@vinfast.vn",
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find((r) => r.roleName === "emv_admin").roleId,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          username: "manager-thaodien",
          name: "Quản lý Thảo Điền",
          password: hashedPassword,
          email: "manager.td@vinfast.vn",
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_manager"
          ).roleId,
          serviceCenterId: createdServiceCenters[0].serviceCenterId,
        },
        {
          username: "staff-thaodien",
          name: "SA Thảo Điền",
          password: hashedPassword,
          email: "staff.td@vinfast.vn",
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_staff"
          ).roleId,
          serviceCenterId: createdServiceCenters[0].serviceCenterId,
        },
        {
          username: "thanhtd",
          name: "Trần Đông Thạnh",
          password: hashedPassword,
          email: "thanh.td@vinfast.vn",
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_staff"
          ).roleId,
          serviceCenterId: createdServiceCenters[0].serviceCenterId,
        },
        {
          username: "tech-thaodien",
          name: "Tech Thảo Điền",
          password: hashedPassword,
          email: "tech.td@vinfast.vn",
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_technician"
          ).roleId,
          serviceCenterId: createdServiceCenters[0].serviceCenterId,
        },
      ],
      { returning: true }
    );

    const createdModels = await VehicleModel.bulkCreate(
      [
        {
          vehicleModelName: "VF 8 Eco",
          yearOfLaunch: "2022-01-01",
          generalWarrantyDuration: 120,
          generalWarrantyMileage: 200000,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          vehicleModelName: "VF 9 Plus",
          yearOfLaunch: "2022-01-01",
          generalWarrantyDuration: 120,
          generalWarrantyMileage: 200000,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
      ],
      { returning: true }
    );
    console.log(
      `✅ Seeded Locations, People & Vehicle Models. Default password for all is "123456"`
    );

    // --- 3. SEED INVENTORY ---
    console.log("🌱 Seeding Inventory (Stock for all warehouses)...");
    const stockData = [];
    for (const type of createdTypeComponents) {
      for (const wh of allWarehouses) {
        const isCentral = !wh.serviceCenterId && !!wh.vehicleCompanyId;
        stockData.push({
          typeComponentId: type.typeComponentId,
          warehouseId: wh.warehouseId,
          quantityInStock: isCentral
            ? faker.number.int({ min: 200, max: 500 }) // kho tổng nhiều
            : faker.number.int({ min: 15, max: 60 }), // kho chi nhánh ít hơn
          // quantityReserved sẽ = 0 theo default của model Stock
        });
      }
    }
    await Stock.bulkCreate(stockData);
    console.log(
      `✅ Seeded ${stockData.length} stock records across ${allWarehouses.length} warehouses.`
    );

    // --- 3b. SEED COMPATIBILITY (WarrantyComponent) ---
    console.log("🌱 Seeding Compatibility (WarrantyComponent)...");
    const warrantyComponents = [];
    for (const model of createdModels) {
      for (const type of createdTypeComponents) {
        warrantyComponents.push({
          vehicleModelId: model.vehicleModelId,
          typeComponentId: type.typeComponentId,
          durationMonth: type.name.includes("Ắc quy") ? 24 : 12,
          mileageLimit: type.name.includes("Ắc quy") ? 40000 : 20000,
        });
      }
    }
    await WarrantyComponent.bulkCreate(warrantyComponents);
    console.log(`✅ Seeded ${warrantyComponents.length} compatibility links.`);

    // --- 4. SEED VEHICLES & CUSTOMERS ---
    console.log("🌱 Seeding Vehicles & Customers...");
    const vehicles = [];
    // 10 new, unactivated vehicles
    for (let i = 0; i < 10; i++) {
      vehicles.push({
        vin: `VIN-NEW-${i}`,
        dateOfManufacture: faker.date.past(),
        placeOfManufacture: "Hải Phòng",
        vehicleModelId:
          faker.helpers.arrayElement(createdModels).vehicleModelId,
        isActivated: false,
        ownerId: null,
        purchaseDate: null,
        licensePlate: null,
      });
    }
    // 5 sold, activated vehicles
    const customers = await Customer.bulkCreate(
      Array.from({ length: 5 }, () => ({
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      })),
      { returning: true }
    );

    for (let i = 0; i < 5; i++) {
      vehicles.push({
        vin: `VIN-SOLD-${i}`,
        dateOfManufacture: faker.date.past(),
        placeOfManufacture: "Hải Phòng",
        vehicleModelId:
          faker.helpers.arrayElement(createdModels).vehicleModelId,
        isActivated: true,
        ownerId: customers[i].id,
        purchaseDate: faker.date.recent({ days: 365 }),
        licensePlate: `51K-${faker.number.int({
          min: 100,
          max: 999,
        })}.${faker.number.int({ min: 10, max: 99 })}`,
      });
    }

    await Vehicle.bulkCreate(vehicles, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${vehicles.length} vehicles.`);

    // --- 5. (Tuỳ chọn) Thống kê số kho theo Service Center ---
    const scIdToCount = createdSCWarehouses.reduce((acc, w) => {
      acc[w.serviceCenterId] = (acc[w.serviceCenterId] || 0) + 1;
      return acc;
    }, {});
    for (const sc of createdServiceCenters) {
      console.log(
        `- ${sc.name}: ${scIdToCount[sc.serviceCenterId] || 0} warehouses`
      );
    }
    console.log(`- Central (company-wide): 1 warehouse`);

    console.log("\n🎉 Seeding finished successfully!");
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
    // Đảm bảo bật lại khóa ngoại ngay cả khi có lỗi
    try {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });
    } catch (e) {}
  } finally {
    await sequelize.close();
  }
};

generateData();
