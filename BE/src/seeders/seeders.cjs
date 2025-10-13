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

// Danh sách lý do nghỉ phép thực tế
const LEAVE_REASONS = [
  "Nghỉ ốm",
  "Nghỉ phép năm",
  "Việc gia đình",
  "Đi công tác",
  "Khám sức khỏe định kỳ",
  "Tham gia đào tạo",
  "Nghỉ lễ",
];

// Danh sách ghi chú cho lịch làm việc
const WORK_NOTES = [
  "Ca sáng",
  "Ca chiều",
  "Hỗ trợ ca tối",
  "Trực khẩn cấp",
  "Làm thêm giờ",
  "",
  "",
  "", // Nhiều trường hợp không có note
];

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
      address: "Khu công nghiệp VSIP, Hải Phòng, Việt Nam",
      phone: "1900232389",
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
        price: 15000000,
        category: "CHARGING_SYSTEM",
      },
      {
        name: "Má phanh trước VF8",
        sku: "VF8-BRK-FRT",
        price: 2500000,
        category: "BRAKING",
      },
      {
        name: "Cảm biến ABS bánh sau",
        sku: "VF-ABS-SEN-R",
        price: 850000,
        category: "BRAKING",
      },
      {
        name: "Giảm xóc trước",
        sku: "VF-SUS-FRT",
        price: 3500000,
        category: "SUSPENSION_STEERING",
      },
      {
        name: "Màn hình trung tâm 15.6 inch",
        sku: "VF-INF-15.6",
        price: 28000000,
        category: "INFOTAINMENT_ADAS",
      },
      {
        name: "Ắc quy 12V",
        sku: "VF-BAT-12V",
        price: 2200000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
      {
        name: "Đèn pha LED",
        sku: "VF-LED-HEAD",
        price: 4500000,
        category: "LOW_VOLTAGE_SYSTEM", // Changed from LIGHTING to LOW_VOLTAGE_SYSTEM
      },
      {
        name: "Bộ phanh đĩa sau",
        sku: "VF-BRK-DISC-R",
        price: 5200000,
        category: "BRAKING",
      },
      {
        name: "Pin cao áp 90kWh",
        sku: "VF-HVB-90",
        price: 450000000,
        category: "HIGH_VOLTAGE_BATTERY",
      },
      {
        name: "Động cơ điện 150kW",
        sku: "VF-MTR-150",
        price: 180000000,
        category: "POWERTRAIN",
      },
      {
        name: "Hệ thống làm mát pin",
        sku: "VF-TMS-BAT",
        price: 35000000,
        category: "THERMAL_MANAGEMENT",
      },
      {
        name: "Máy điều hòa cabin",
        sku: "VF-HVAC-01",
        price: 25000000,
        category: "HVAC",
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
        address: "12 Quốc Hương, Thảo Điền, TP. Thủ Đức, TP. HCM",
        phone: "02873008889",
      },
      {
        name: "VinFast Long Biên",
        address: "Vincom Plaza Long Biên, 27 Cổ Linh, Long Biên, Hà Nội",
        phone: "02436622888",
      },
      {
        name: "VinFast Đà Nẵng",
        address: "99A Đường 2 Tháng 9, Hải Châu, Đà Nẵng",
        phone: "02363666888",
      },
    ];

    const createdServiceCenters = await ServiceCenter.bulkCreate(
      serviceCenterData.map((sc) => ({
        ...sc,
        vehicleCompanyId: createdCompany.vehicleCompanyId,
      }))
    );

    const centralWarehouse = await Warehouse.create({
      name: "Tổng kho VinFast Việt Nam",
      address: "Khu công nghiệp VSIP, Hải Phòng",
      vehicleCompanyId: createdCompany.vehicleCompanyId,
    });

    const perSCWarehousesPayload = createdServiceCenters.flatMap((sc) => [
      {
        name: `${sc.name} - Kho Linh Kiện`,
        address: `${sc.address} - Khu A`,
        serviceCenterId: sc.serviceCenterId,
      },
      {
        name: `${sc.name} - Kho Phụ Tùng`,
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
      username: "admin.vinfast",
      name: "Nguyễn Văn Quản",
      password: hashedPassword,
      email: "admin@vinfast.vn",
      phone: "0901234567",
      address: "Hải Phòng, Việt Nam",
      roleId: createdRoles.find((r) => r.roleName === "emv_admin").roleId,
      vehicleCompanyId: createdCompany.vehicleCompanyId,
    });

    // Danh sách tên họ và tên đệm phổ biến
    const lastNames = [
      "Nguyễn",
      "Trần",
      "Lê",
      "Phạm",
      "Hoàng",
      "Phan",
      "Vũ",
      "Đặng",
      "Bùi",
      "Đỗ",
    ];
    const middleNames = [
      "Văn",
      "Thị",
      "Đức",
      "Minh",
      "Hồng",
      "Anh",
      "Thanh",
      "Quốc",
      "Hữu",
    ];
    const firstNames = [
      "An",
      "Bình",
      "Cường",
      "Dũng",
      "Hùng",
      "Khoa",
      "Linh",
      "Nam",
      "Phong",
      "Quân",
      "Sơn",
      "Tâm",
      "Tuấn",
      "Vinh",
      "Mai",
      "Lan",
      "Hương",
      "Thảo",
      "Trang",
    ];

    const generateVietnameseName = () => {
      const lastName = faker.helpers.arrayElement(lastNames);
      const middleName = faker.helpers.arrayElement(middleNames);
      const firstName = faker.helpers.arrayElement(firstNames);
      return `${lastName} ${middleName} ${firstName}`;
    };

    // Tạo nhiều nhân viên cho mỗi trung tâm
    for (const center of createdServiceCenters) {
      const centerNameShort = center.name.split(" ")[1].toLowerCase();

      // 1 Manager/Center
      usersPayload.push({
        username: `manager.${centerNameShort}`,
        name: `${generateVietnameseName()}`,
        password: hashedPassword,
        email: `manager.${centerNameShort}@vinfast.vn`,
        phone: `09${faker.number.int({ min: 10000000, max: 99999999 })}`,
        address: center.address.split(",")[0],
        roleId: createdRoles.find(
          (r) => r.roleName === "service_center_manager"
        ).roleId,
        serviceCenterId: center.serviceCenterId,
      });

      // Nhiều Staff/Center
      for (let i = 1; i <= NUM_STAFF_PER_CENTER; i++) {
        usersPayload.push({
          username: `staff${i}.${centerNameShort}`,
          name: `${generateVietnameseName()}`,
          password: hashedPassword,
          email: `staff${i}.${centerNameShort}@vinfast.vn`,
          phone: `09${faker.number.int({ min: 10000000, max: 99999999 })}`,
          address: center.address.split(",")[0],
          roleId: createdRoles.find(
            (r) => r.roleName === "service_center_staff"
          ).roleId,
          serviceCenterId: center.serviceCenterId,
        });
      }

      // Nhiều Tech/Center
      for (let i = 1; i <= NUM_TECH_PER_CENTER; i++) {
        usersPayload.push({
          username: `tech${i}.${centerNameShort}`,
          name: `${generateVietnameseName()}`,
          password: hashedPassword,
          email: `tech${i}.${centerNameShort}@vinfast.vn`,
          phone: `09${faker.number.int({ min: 10000000, max: 99999999 })}`,
          address: center.address.split(",")[0],
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
          yearOfLaunch: "2022-06-15",
          generalWarrantyDuration: 120,
          generalWarrantyMileage: 200000,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          vehicleModelName: "VF 8 Plus",
          yearOfLaunch: "2022-06-15",
          generalWarrantyDuration: 120,
          generalWarrantyMileage: 200000,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          vehicleModelName: "VF 9 Eco",
          yearOfLaunch: "2022-11-20",
          generalWarrantyDuration: 120,
          generalWarrantyMileage: 200000,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          vehicleModelName: "VF 9 Plus",
          yearOfLaunch: "2022-11-20",
          generalWarrantyDuration: 120,
          generalWarrantyMileage: 200000,
          vehicleCompanyId: createdCompany.vehicleCompanyId,
        },
        {
          vehicleModelName: "VF e34",
          yearOfLaunch: "2021-08-01",
          generalWarrantyDuration: 96,
          generalWarrantyMileage: 150000,
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
            ? faker.number.int({ min: 500, max: 1000 })
            : faker.number.int({ min: 20, max: 80 }),
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
        // Pin và hệ thống điện có bảo hành dài hơn
        const isLongWarranty =
          type.category === "CHARGING_SYSTEM" ||
          type.category === "LOW_VOLTAGE_SYSTEM";

        warrantyComponents.push({
          vehicleModelId: model.vehicleModelId,
          typeComponentId: type.typeComponentId,
          durationMonth: isLongWarranty ? 96 : 36,
          mileageLimit: isLongWarranty ? 160000 : 100000,
        });
      }
    }
    await WarrantyComponent.bulkCreate(warrantyComponents);
    console.log(`✅ Seeded ${warrantyComponents.length} compatibility links.`);

    // --- 4. SEED VEHICLES & CUSTOMERS ---
    console.log("🌱 Seeding Vehicles & Customers...");
    const vehicles = [];

    // Xe chưa bán
    for (let i = 0; i < NUM_NEW_VEHICLES; i++) {
      const model = faker.helpers.arrayElement(createdModels);
      const manufactureDate = faker.date.between({
        from: new Date("2023-01-01"),
        to: new Date("2024-12-31"),
      });

      vehicles.push({
        vin: `VIN${model.vehicleModelName.replace(/\s/g, "")}NEW${String(
          i
        ).padStart(3, "0")}`,
        dateOfManufacture: manufactureDate,
        placeOfManufacture: "Hải Phòng, Việt Nam",
        vehicleModelId: model.vehicleModelId,
        ownerId: null,
        purchaseDate: null,
        licensePlate: null,
      });
    }

    // Tạo khách hàng và xe đã bán
    const customers = await Customer.bulkCreate(
      Array.from({ length: NUM_SOLD_VEHICLES }, () => ({
        fullName: generateVietnameseName(),
        email: faker.internet.email(),
        phone: `09${faker.number.int({ min: 10000000, max: 99999999 })}`,
        address: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(
          ["TP. HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"]
        )}`,
      }))
    );

    for (let i = 0; i < NUM_SOLD_VEHICLES; i++) {
      const model = faker.helpers.arrayElement(createdModels);
      const manufactureDate = faker.date.between({
        from: new Date("2022-01-01"),
        to: new Date("2024-06-30"),
      });
      const purchaseDate = new Date(manufactureDate);
      purchaseDate.setMonth(
        purchaseDate.getMonth() + faker.number.int({ min: 1, max: 6 })
      );

      const cityCode = faker.helpers.arrayElement([
        "51",
        "30",
        "43",
        "65",
        "99",
      ]);
      const letter = faker.helpers.arrayElement([
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "K",
        "L",
        "M",
        "N",
        "P",
        "S",
        "T",
        "V",
        "X",
        "Y",
        "Z",
      ]);

      vehicles.push({
        vin: `VIN${model.vehicleModelName.replace(/\s/g, "")}SOLD${String(
          i
        ).padStart(3, "0")}`,
        dateOfManufacture: manufactureDate,
        placeOfManufacture: "Hải Phòng, Việt Nam",
        vehicleModelId: model.vehicleModelId,
        ownerId: customers[i].id,
        purchaseDate: purchaseDate,
        licensePlate: `${cityCode}${letter}-${faker.number.int({
          min: 100,
          max: 999,
        })}.${faker.number.int({ min: 10, max: 99 })}`,
      });
    }

    await Vehicle.bulkCreate(vehicles, { ignoreDuplicates: true });
    console.log(
      `✅ Seeded ${vehicles.length} vehicles (${NUM_NEW_VEHICLES} new, ${NUM_SOLD_VEHICLES} sold).`
    );

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

    // Tạo lịch cho 60 ngày (30 ngày trước + 30 ngày sau)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);

    for (const tech of technicians) {
      // Mỗi kỹ thuật viên có pattern riêng về nghỉ
      const hasRegularDayOff = Math.random() > 0.3; // 70% có ngày nghỉ cố định
      const regularDayOff = faker.number.int({ min: 0, max: 6 }); // 0=CN, 1=T2, ...

      for (let i = 0; i < 60; i++) {
        const workDate = new Date(startDate);
        workDate.setDate(startDate.getDate() + i);
        const dayOfWeek = workDate.getDay();

        let status = "WORKING";
        let requestReason = null;
        let notes = null;

        // Logic xác định trạng thái
        if (hasRegularDayOff && dayOfWeek === regularDayOff) {
          // Ngày nghỉ cố định
          status = "DAY_OFF";
          notes = "Ngày nghỉ hàng tuần";
        } else if (dayOfWeek === 0 && Math.random() > 0.7) {
          // 30% nghỉ Chủ nhật không phải ngày nghỉ cố định
          status = "DAY_OFF";
          notes = "Ngày nghỉ Chủ nhật";
        } else if (Math.random() > 0.95) {
          // 5% nghỉ đột xuất
          const leaveType = faker.helpers.arrayElement([
            "LEAVE_REQUESTED",
            "LEAVE_APPROVED",
          ]);
          status = leaveType;
          requestReason = faker.helpers.arrayElement(LEAVE_REASONS);
          notes = null;
        } else {
          // Làm việc bình thường
          status = "WORKING";
          notes = faker.helpers.arrayElement(WORK_NOTES);
        }

        schedules.push({
          technicianId: tech.userId,
          workDate: workDate.toISOString().slice(0, 10),
          status: status,
          requestReason: requestReason,
          notes: notes,
        });
      }
    }

    await WorkSchedule.bulkCreate(schedules);
    console.log(
      `✅ Seeded ${schedules.length} schedule entries for ${technicians.length} technicians (60 days range).`
    );

    console.log("\n🎉 Seeding finished successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Company: ${createdCompany.name}`);
    console.log(`   - Service Centers: ${createdServiceCenters.length}`);
    console.log(`   - Warehouses: ${allWarehouses.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Vehicle Models: ${createdModels.length}`);
    console.log(`   - Components: ${createdTypeComponents.length}`);
    console.log(`   - Vehicles: ${vehicles.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Work Schedules: ${schedules.length}`);
    console.log(`\n🔐 Default password for all users: "123456"`);
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

generateData();
