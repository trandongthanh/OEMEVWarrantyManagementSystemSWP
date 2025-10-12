// seeder.cjs
const { faker } = require("@faker-js/faker/locale/vi"); // Sử dụng locale Tiếng Việt
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");

const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];

// Import tất cả các model
const models = require("../models/index.cjs");
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
  WorkSchedule,
} = models;

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

const NUM_STAFF_PER_CENTER = 3;
const NUM_TECH_PER_CENTER = 5;
const NUM_NEW_VEHICLES = 50;
const NUM_SOLD_VEHICLES = 30;

const generateData = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");

    console.log("🔥 Resetting database...");
    await sequelize.sync({ force: true });
    console.log("✅ Database synchronized (all tables dropped and recreated).");
    // --- 1. SEED CORE DATA ---
    console.log("🌱 Seeding Core Data...");
    const createdCompany = await VehicleCompany.create({
      name: "VinFast",
      address: "Hải Phòng, Việt Nam",
      phone: faker.phone.number(),
      email: "info@vinfast.vn",
    });
    const createdRoles = await Role.bulkCreate([
      { roleName: "service_center_staff" },
      { roleName: "service_center_manager" },
      { roleName: "service_center_technician" },
      { roleName: "emv_admin" },
    ]);
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
      typeComponentData
    );
    console.log("✅ Seeded Core Data (Company, Roles, TypeComponents).");

    // --- 2. SEED LOCATIONS, PEOPLE & VEHICLE MODELS ---
    console.log("🌱 Seeding Locations, People & Vehicle Models...");
    const serviceCenterData = [
      {
        name: "VinFast Thảo Điền",
        address: "12 Quốc Hương, Thảo Điền, TP. Thủ Đức",
      },
      { name: "VinFast Long Biên", address: "Vincom Plaza Long Biên, Hà Nội" },
      {
        name: "VinFast Đà Nẵng",
        address: "99A Đường 2 Tháng 9, Hải Châu, Đà Nẵng",
      },
    ];
    const createdServiceCenters = await ServiceCenter.bulkCreate(
      serviceCenterData.map((sc) => ({
        ...sc,
        phone: faker.phone.number(),
        vehicleCompanyId: createdCompany.vehicleCompanyId,
      }))
    );

    const centralWarehouse = await Warehouse.create({
      name: "Tổng kho VinFast Việt Nam",
      address: "Hải Phòng",
      vehicleCompanyId: createdCompany.vehicleCompanyId,
    });
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
      perSCWarehousesPayload
    );
    const allWarehouses = [centralWarehouse, ...createdSCWarehouses];

    const hashedPassword = await bcrypt.hash("123456", 10);
    const usersPayload = [];

    // Tạo Admin Hãng
    usersPayload.push({
      username: "admin-vinfast",
      name: "Admin Hãng",
      password: hashedPassword,
      email: "admin@vinfast.vn",
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      roleId: createdRoles.find((r) => r.roleName === "emv_admin").roleId,
      vehicleCompanyId: createdCompany.vehicleCompanyId,
    });

    // Tạo nhiều nhân viên cho mỗi trung tâm
    for (const center of createdServiceCenters) {
      const centerNameShort = center.name.split(" ")[1].toLowerCase();

      // 1 Manager/Center
      usersPayload.push({
        username: `manager-${centerNameShort}`,
        name: `Quản lý ${center.name}`,
        password: hashedPassword,
        email: `manager.${centerNameShort}@vinfast.vn`,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        roleId: createdRoles.find(
          (r) => r.roleName === "service_center_manager"
        ).roleId,
        serviceCenterId: center.serviceCenterId,
      });

      // Nhiều Staff/Center
      for (let i = 1; i <= NUM_STAFF_PER_CENTER; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        usersPayload.push({
          username: `staff${i}-${centerNameShort}`,
          name: `SA ${lastName} ${firstName}`,
          password: hashedPassword,
          email: `staff${i}.${centerNameShort}@vinfast.vn`,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_staff"
          ).roleId,
          serviceCenterId: center.serviceCenterId,
        });
      }

      // Nhiều Tech/Center
      for (let i = 1; i <= NUM_TECH_PER_CENTER; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        usersPayload.push({
          username: `tech${i}-${centerNameShort}`,
          name: `KTV ${lastName} ${firstName}`,
          password: hashedPassword,
          email: `tech${i}.${centerNameShort}@vinfast.vn`,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_technician"
          ).roleId,
          serviceCenterId: center.serviceCenterId,
        });
      }
    }

    const createdUsers = await User.bulkCreate(usersPayload, {
      returning: true,
    });
    console.log(
      `✅ Seeded ${createdUsers.length} users. Default password for all is "123456"`
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
    console.log(`✅ Seeded Locations, People & Vehicle Models.`);

    // --- 3. SEED INVENTORY & COMPATIBILITY ---
    console.log("🌱 Seeding Inventory (Stock for all warehouses)...");
    const stockData = [];
    for (const type of createdTypeComponents) {
      for (const wh of allWarehouses) {
        const isCentral = !wh.serviceCenterId && !!wh.vehicleCompanyId;
        stockData.push({
          typeComponentId: type.typeComponentId,
          warehouseId: wh.warehouseId,
          quantityInStock: isCentral
            ? faker.number.int({ min: 200, max: 500 })
            : faker.number.int({ min: 15, max: 60 }),
        });
      }
    }
    await Stock.bulkCreate(stockData);
    console.log(
      `✅ Seeded ${stockData.length} stock records across ${allWarehouses.length} warehouses.`
    );

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
    for (let i = 0; i < NUM_NEW_VEHICLES; i++) {
      vehicles.push({
        vin: `VIN-NEW-${i}`,
        dateOfManufacture: faker.date.past({ years: 2 }),
        placeOfManufacture: "Hải Phòng",
        vehicleModelId:
          faker.helpers.arrayElement(createdModels).vehicleModelId,
        ownerId: null,
        purchaseDate: null,
        licensePlate: null,
      });
    }
    const customers = await Customer.bulkCreate(
      Array.from({ length: NUM_SOLD_VEHICLES }, () => ({
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      }))
    );
    for (let i = 0; i < NUM_SOLD_VEHICLES; i++) {
      vehicles.push({
        vin: `VIN-SOLD-${i}`,
        dateOfManufacture: faker.date.past({ years: 3 }),
        placeOfManufacture: "Hải Phòng",
        vehicleModelId:
          faker.helpers.arrayElement(createdModels).vehicleModelId,
        ownerId: customers[i].id,
        purchaseDate: faker.date.recent({ days: 730 }),
        licensePlate: `51K-${faker.number.int({
          min: 100,
          max: 999,
        })}.${faker.number.int({ min: 10, max: 99 })}`,
      });
    }
    await Vehicle.bulkCreate(vehicles, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${vehicles.length} vehicles.`);

    // --- 5. SEED WORK SCHEDULES ---
    console.log("🌱 Seeding Work Schedules for Technicians...");
    const technicians = createdUsers.filter(
      (u) =>
        u.roleId ===
        createdRoles.find((r) => r.roleName === "service_center_technician")
          .roleId
    );
    const schedules = [];
    const today = new Date();

    for (const tech of technicians) {
      for (let i = 0; i < 14; i++) {
        // Tạo lịch cho 14 ngày tới
        const workDate = new Date(today);
        workDate.setDate(today.getDate() + i);
        const dayOfWeek = workDate.getDay(); // 0=CN, 6=T7

        // Giả lập một số người nghỉ vào Chủ nhật
        const status =
          dayOfWeek === 0 && Math.random() > 0.5 ? "DAY_OFF" : "WORKING";

        schedules.push({
          technicianId: tech.userId,
          workDate: workDate.toISOString().slice(0, 10),
          status: status,
        });
      }
    }
    await WorkSchedule.bulkCreate(schedules);
    console.log(
      `✅ Seeded ${schedules.length} schedule entries for ${technicians.length} technicians.`
    );

    console.log("\n🎉 Seeding finished successfully!");
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

generateData();
