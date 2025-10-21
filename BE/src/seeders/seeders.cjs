// src/seeders/seeders.cjs
const { faker } = require("@faker-js/faker/locale/vi");
const { Sequelize, Op } = require("sequelize");
const bcrypt = require("bcrypt");
const path = require("path");

const env = process.env.NODE_ENV || "development";
// Đảm bảo đường dẫn này trỏ đúng đến file config.json của bạn từ thư mục seeders
const config = require(path.join(__dirname, "../config/config.json"))[env];

// Import tất cả các model (Đảm bảo đường dẫn này đúng)
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
  Component, // Đảm bảo Component model tồn tại
  // Thêm các model khác nếu bạn đã tạo (ví dụ: DiagnosticFee, TaskAssignment...)
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

// --- CONFIGURATION ---
const NUM_STAFF_PER_CENTER = 3;
const NUM_TECH_PER_CENTER = 5;
const NUM_NEW_VEHICLES = 50;
const NUM_SOLD_VEHICLES = 30;
const NUM_COMPONENTS_PER_TYPE = 10; // Số lượng linh kiện vật lý cho mỗi loại

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
  "",
];

// Hàm tạo tên tiếng Việt ngẫu nhiên
const generateVietnameseName = () => {
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
  return `${faker.helpers.arrayElement(lastNames)} ${faker.helpers.arrayElement(
    middleNames
  )} ${faker.helpers.arrayElement(firstNames)}`;
};

// Hàm tạo VIN 17 ký tự
const generateVIN = (modelCode, serialNumber) => {
  const WMI = "8VV"; // VinFast VN
  const VDS = modelCode.padEnd(6, "0");
  const year = "P"; // P = 2024 (Ví dụ)
  const plant = "H"; // H = Hải Phòng
  const serial = String(serialNumber).padStart(6, "0");
  const VIS = year + plant + serial;
  return WMI + VDS + VIS;
};

const generateData = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");

    console.log("🔥 Resetting database using sync({ force: true })...");
    await sequelize.sync({ force: true }); // Dùng sync force để reset an toàn
    console.log("✅ Database reset successfully.");

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
      // HIGH VOLTAGE BATTERY - Pin cao áp
      {
        name: "Pin cao áp 87.7kWh - VF8",
        sku: "VF8-HVB-87.7",
        price: 420000000,
        category: "HIGH_VOLTAGE_BATTERY",
      },
      {
        name: "Pin cao áp 92kWh - VF9",
        sku: "VF9-HVB-92",
        price: 480000000,
        category: "HIGH_VOLTAGE_BATTERY",
      },
      {
        name: "Pin cao áp 42kWh - VFe34",
        sku: "VFE34-HVB-42",
        price: 250000000,
        category: "HIGH_VOLTAGE_BATTERY",
      },
      {
        name: "Module pin 4kWh",
        sku: "VF-HVB-MOD-4",
        price: 28000000,
        category: "HIGH_VOLTAGE_BATTERY",
      },
      {
        name: "BMS - Hệ thống quản lý pin",
        sku: "VF-BMS-01",
        price: 45000000,
        category: "HIGH_VOLTAGE_BATTERY",
      },
      // POWERTRAIN - Hệ thống truyền động
      {
        name: "Động cơ điện 150kW - Trước",
        sku: "VF-MTR-150-F",
        price: 180000000,
        category: "POWERTRAIN",
      },
      {
        name: "Động cơ điện 150kW - Sau",
        sku: "VF-MTR-150-R",
        price: 180000000,
        category: "POWERTRAIN",
      },
      {
        name: "Động cơ điện 200kW - VF9",
        sku: "VF9-MTR-200",
        price: 220000000,
        category: "POWERTRAIN",
      },
      {
        name: "Bộ giảm tốc 1 cấp",
        sku: "VF-GBX-01",
        price: 45000000,
        category: "POWERTRAIN",
      },
      {
        name: "Bộ nghịch lưu (Inverter)",
        sku: "VF-INV-01",
        price: 65000000,
        category: "POWERTRAIN",
      },
      // CHARGING SYSTEM - Hệ thống sạc
      {
        name: "Bộ sạc trong xe OBC 11kW",
        sku: "VF-OBC-11",
        price: 15000000,
        category: "CHARGING_SYSTEM",
      },
      {
        name: "Bộ sạc trong xe OBC 22kW",
        sku: "VF-OBC-22",
        price: 28000000,
        category: "CHARGING_SYSTEM",
      },
      {
        name: "Cổng sạc AC Type 2",
        sku: "VF-CHG-AC-T2",
        price: 3500000,
        category: "CHARGING_SYSTEM",
      },
      {
        name: "Cổng sạc DC CCS2",
        sku: "VF-CHG-DC-CCS2",
        price: 8500000,
        category: "CHARGING_SYSTEM",
      },
      {
        name: "Cáp sạc AC 16A",
        sku: "VF-CBL-AC-16",
        price: 4200000,
        category: "CHARGING_SYSTEM",
      },
      // THERMAL MANAGEMENT - Quản lý nhiệt
      {
        name: "Hệ thống làm mát pin",
        sku: "VF-TMS-BAT",
        price: 35000000,
        category: "THERMAL_MANAGEMENT",
      },
      {
        name: "Bơm nước làm mát",
        sku: "VF-WP-01",
        price: 6500000,
        category: "THERMAL_MANAGEMENT",
      },
      {
        name: "Két nước giải nhiệt",
        sku: "VF-RAD-01",
        price: 12000000,
        category: "THERMAL_MANAGEMENT",
      },
      // HVAC - Điều hòa
      {
        name: "Máy điều hòa cabin Heat Pump",
        sku: "VF-HVAC-HP",
        price: 35000000,
        category: "HVAC",
      },
      {
        name: "Compressor điều hòa điện",
        sku: "VF-HVAC-CMP",
        price: 18000000,
        category: "HVAC",
      },
      {
        name: "Lõi giàn lạnh",
        sku: "VF-HVAC-EVAP",
        price: 8500000,
        category: "HVAC",
      },
      // BRAKING - Phanh
      {
        name: "Má phanh trước VF8",
        sku: "VF8-BRK-FRT-PAD",
        price: 2500000,
        category: "BRAKING",
      },
      {
        name: "Má phanh sau VF8",
        sku: "VF8-BRK-RR-PAD",
        price: 2200000,
        category: "BRAKING",
      },
      {
        name: "Đĩa phanh trước",
        sku: "VF-BRK-DISC-F",
        price: 4500000,
        category: "BRAKING",
      },
      {
        name: "Đĩa phanh sau",
        sku: "VF-BRK-DISC-R",
        price: 4200000,
        category: "BRAKING",
      },
      {
        name: "Bộ phanh ABS",
        sku: "VF-ABS-01",
        price: 25000000,
        category: "BRAKING",
      },
      {
        name: "Cảm biến ABS bánh trước",
        sku: "VF-ABS-SEN-F",
        price: 850000,
        category: "BRAKING",
      },
      {
        name: "Cảm biến ABS bánh sau",
        sku: "VF-ABS-SEN-R",
        price: 850000,
        category: "BRAKING",
      },
      // SUSPENSION & STEERING - Giảm xóc và lái
      {
        name: "Giảm xóc trước trái",
        sku: "VF-SUS-FRT-L",
        price: 3500000,
        category: "SUSPENSION_STEERING",
      },
      {
        name: "Giảm xóc trước phải",
        sku: "VF-SUS-FRT-R",
        price: 3500000,
        category: "SUSPENSION_STEERING",
      },
      {
        name: "Giảm xóc sau",
        sku: "VF-SUS-RR",
        price: 3200000,
        category: "SUSPENSION_STEERING",
      },
      {
        name: "Hệ thống lái trợ lực điện EPS",
        sku: "VF-EPS-01",
        price: 32000000,
        category: "SUSPENSION_STEERING",
      },
      {
        name: "Càng A trước dưới",
        sku: "VF-ARM-FRT-LOW",
        price: 4800000,
        category: "SUSPENSION_STEERING",
      },
      // INFOTAINMENT & ADAS
      {
        name: "Màn hình trung tâm 15.6 inch",
        sku: "VF-INF-15.6",
        price: 28000000,
        category: "INFOTAINMENT_ADAS",
      },
      {
        name: "Camera 360 độ (bộ 4 camera)",
        sku: "VF-CAM-360",
        price: 12000000,
        category: "INFOTAINMENT_ADAS",
      },
      {
        name: "Radar trước ADAS",
        sku: "VF-RADAR-FRT",
        price: 18000000,
        category: "INFOTAINMENT_ADAS",
      },
      {
        name: "Cảm biến siêu âm (bộ 12)",
        sku: "VF-USS-12",
        price: 8500000,
        category: "INFOTAINMENT_ADAS",
      },
      // LOW VOLTAGE SYSTEM - Hệ thống điện 12V
      {
        name: "Ắc quy 12V 60Ah",
        sku: "VF-BAT-12V-60",
        price: 2200000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
      {
        name: "Bộ chuyển đổi DC/DC 12V",
        sku: "VF-DCDC-12V",
        price: 8500000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
      {
        name: "Đèn pha LED trái",
        sku: "VF-LED-HEAD-L",
        price: 4500000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
      {
        name: "Đèn pha LED phải",
        sku: "VF-LED-HEAD-R",
        price: 4500000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
      {
        name: "Đèn hậu LED trái",
        sku: "VF-LED-TAIL-L",
        price: 3800000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
      {
        name: "Đèn hậu LED phải",
        sku: "VF-LED-TAIL-R",
        price: 3800000,
        category: "LOW_VOLTAGE_SYSTEM",
      },
    ];

    // Lọc SKU trùng lặp
    const uniqueSkus = new Set();
    const uniqueTypeComponentData = typeComponentData.filter((component) => {
      if (!component.sku) {
        console.warn("Component missing SKU:", component.name);
        return false;
      }
      if (uniqueSkus.has(component.sku)) {
        console.warn(
          `Duplicate SKU found and removed: ${component.sku} (${component.name})`
        );
        return false;
      }
      uniqueSkus.add(component.sku);
      return true;
    });

    const createdTypeComponents = await TypeComponent.bulkCreate(
      uniqueTypeComponentData
    );
    console.log(
      `✅ Seeded ${createdTypeComponents.length} unique Type Components.`
    );

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
    for (const center of createdServiceCenters) {
      const centerNameShort = center.name.split(" ")[1].toLowerCase();
      // 1 Manager/Center
      usersPayload.push({
        username: `manager.${centerNameShort}`,
        name: `Quản lý ${center.name}`,
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
          name: `SA ${generateVietnameseName()}`,
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
          name: `KTV ${generateVietnameseName()}`,
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
    console.log(`✅ Seeded ${createdModels.length} Vehicle Models.`);

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
        const isLongWarranty =
          type.category === "CHARGING_SYSTEM" ||
          type.category === "LOW_VOLTAGE_SYSTEM" ||
          type.category === "HIGH_VOLTAGE_BATTERY" ||
          type.category === "POWERTRAIN";
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
    let vinSerialCounter = 1000;

    // Xe chưa bán
    for (let i = 0; i < NUM_NEW_VEHICLES; i++) {
      const model = faker.helpers.arrayElement(createdModels);
      const manufactureDate = faker.date.between({
        from: new Date("2023-01-01"),
        to: new Date("2024-12-31"),
      });
      const modelCode = model.vehicleModelName
        .replace(/\s+/g, "")
        .substring(0, 6)
        .toUpperCase();
      vehicles.push({
        vin: generateVIN(modelCode, vinSerialCounter++),
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
      })),
      { returning: true }
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
      const modelCode = model.vehicleModelName
        .replace(/\s+/g, "")
        .substring(0, 6)
        .toUpperCase();
      vehicles.push({
        vin: generateVIN(modelCode, vinSerialCounter++),
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

    await Vehicle.bulkCreate(vehicles, { ignoreDuplicates: true }); // ignoreDuplicates để tránh lỗi nếu generateVIN bị trùng
    const createdVehicles = await Vehicle.findAll(); // Lấy lại danh sách vehicles đã tạo để dùng VIN hợp lệ
    console.log(
      `✅ Seeded ${createdVehicles.length} vehicles (${NUM_NEW_VEHICLES} new estimated, ${NUM_SOLD_VEHICLES} sold).`
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
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    for (const tech of technicians) {
      const hasRegularDayOff = Math.random() > 0.3;
      const regularDayOff = faker.number.int({ min: 0, max: 6 });
      for (let i = 0; i < 60; i++) {
        const workDate = new Date(startDate);
        workDate.setDate(startDate.getDate() + i);
        const dayOfWeek = workDate.getDay();
        let status = "WORKING";
        let requestReason = null;
        let notes = null;
        if (hasRegularDayOff && dayOfWeek === regularDayOff) {
          status = "DAY_OFF";
          notes = "Ngày nghỉ hàng tuần";
        } else if (dayOfWeek === 0 && Math.random() > 0.7) {
          status = "DAY_OFF";
          notes = "Ngày nghỉ Chủ nhật";
        } else if (Math.random() > 0.95) {
          const leaveType = faker.helpers.arrayElement([
            "LEAVE_REQUESTED",
            "LEAVE_APPROVED",
          ]);
          status = leaveType;
          requestReason = faker.helpers.arrayElement(LEAVE_REASONS);
          notes = null;
        } else {
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

    // --- 6. SEED COMPONENTS ---
    console.log("🌱 Seeding Components (Physical components)...");
    const components = [];
    let serialCounterComp = 1000;
    const validWarehouseIds = allWarehouses.map((wh) => wh.warehouseId);
    const validTechnicianIds = technicians.map((tech) => tech.userId);
    const soldVehicleVINs = createdVehicles
      .filter((v) => v.ownerId !== null)
      .map((v) => v.vin); // Dùng createdVehicles

    for (const typeComponent of createdTypeComponents) {
      const skuPrefix = typeComponent.sku.substring(0, 6).toUpperCase();
      for (let i = 0; i < NUM_COMPONENTS_PER_TYPE; i++) {
        serialCounterComp++;
        const serialNumber = `${skuPrefix}-${String(serialCounterComp).padStart(
          6,
          "0"
        )}`;
        const statusRoll = Math.random();
        let status,
          warehouseId = null,
          currentHolderId = null,
          vehicleVin = null,
          installedAt = null;

        if (statusRoll < 0.6) {
          status = "IN_WAREHOUSE";
          warehouseId = faker.helpers.arrayElement(validWarehouseIds);
        } else if (statusRoll < 0.75 && soldVehicleVINs.length > 0) {
          status = "INSTALLED";
          vehicleVin = faker.helpers.arrayElement(soldVehicleVINs);
          const vehicle = createdVehicles.find((v) => v.vin === vehicleVin);
          installedAt = faker.date.between({
            from: vehicle.purchaseDate,
            to: new Date(),
          });
        } else if (statusRoll < 0.85 && validTechnicianIds.length > 0) {
          status = "WITH_TECHNICIAN";
          currentHolderId = faker.helpers.arrayElement(validTechnicianIds);
        } else if (statusRoll < 0.95) {
          status = "RESERVED";
          warehouseId = faker.helpers.arrayElement(validWarehouseIds);
        } else {
          status = "PICKED_UP";
        }

        // Đảm bảo các trường không liên quan là null
        if (status !== "IN_WAREHOUSE" && status !== "RESERVED")
          warehouseId = null;
        if (status !== "WITH_TECHNICIAN") currentHolderId = null;
        if (status !== "INSTALLED") {
          vehicleVin = null;
          installedAt = null;
        }

        components.push({
          typeComponentId: typeComponent.typeComponentId,
          serialNumber,
          warehouseId,
          status,
          currentHolderId,
          vehicleVin,
          installedAt,
        });
      }
    }
    await Component.bulkCreate(components);
    console.log(`✅ Seeded ${components.length} physical components.`);

    // --- FINAL SUMMARY ---
    console.log("\n🎉 Seeding finished successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Company: ${createdCompany.name}`);
    console.log(`   - Service Centers: ${createdServiceCenters.length}`);
    console.log(`   - Warehouses: ${allWarehouses.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Vehicle Models: ${createdModels.length}`);
    console.log(
      `   - Type Components: ${createdTypeComponents.length} (unique)`
    );
    console.log(`   - Physical Components: ${components.length}`);
    console.log(`   - Vehicles: ${createdVehicles.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Work Schedules: ${schedules.length}`);
    console.log(`\n🔐 Default password for all users: "123456"`);
  } catch (error) {
    console.error("❌ Unable to seed database:", error);
    if (error.original) console.error("   Original Error:", error.original);
    if (error.errors) console.error("   Validation Errors:", error.errors);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log("🔒 Database connection closed.");
    }
  }
};

generateData();
