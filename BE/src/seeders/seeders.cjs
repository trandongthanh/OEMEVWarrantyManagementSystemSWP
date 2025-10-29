const { sequelize } = require("../models/index.cjs");
const bcrypt = require("bcrypt");

async function seedDatabase() {
  try {
    console.log("🌱 Bắt đầu tạo dữ liệu mẫu THỰC TẾ & ĐẦY ĐỦ...\n");

    // ========================================
    // 1. TẠO VEHICLE COMPANY
    // ========================================
    const [vehicleCompany] = await sequelize.models.VehicleCompany.findOrCreate(
      {
        where: { name: "VinFast Auto" },
        defaults: {
          name: "VinFast Auto",
          address: "Khu Công nghệ cao Hòa Lạc, Hà Nội",
          phone: "1900232389",
          email: "contact@vinfastauto.com",
        },
      }
    );
    console.log("✅ VehicleCompany:", vehicleCompany.name);

    // ========================================
    // 2. TẠO COMPONENT COMPANIES
    // ========================================
    const componentCompanies = {};

    const [catl] = await sequelize.models.ComponentCompany.findOrCreate({
      where: { name: "CATL Battery" },
      defaults: {
        name: "CATL Battery",
        address: "Ningde, Fujian, China",
        phone: "+86-593-8988888",
        email: "info@catl.com",
      },
    });
    componentCompanies.catl = catl;

    const [bosch] = await sequelize.models.ComponentCompany.findOrCreate({
      where: { name: "Bosch Automotive" },
      defaults: {
        name: "Bosch Automotive",
        address: "Stuttgart, Germany",
        phone: "+49-711-811-0",
        email: "contact@bosch.com",
      },
    });
    componentCompanies.bosch = bosch;

    const [lg] = await sequelize.models.ComponentCompany.findOrCreate({
      where: { name: "LG Electronics" },
      defaults: {
        name: "LG Electronics",
        address: "Seoul, South Korea",
        phone: "+82-2-3777-1114",
        email: "info@lge.com",
      },
    });
    componentCompanies.lg = lg;

    console.log("✅ ComponentCompany: 3 nhà cung cấp");

    // ========================================
    // 3. TẠO VEHICLE MODELS - 4 DÒNG XE
    // ========================================
    const vehicleModels = {};

    const [vfe34] = await sequelize.models.VehicleModel.findOrCreate({
      where: { vehicleModelName: "VF e34" },
      defaults: {
        vehicleModelName: "VF e34",
        yearOfLaunch: new Date("2022-01-01"),
        generalWarrantyDuration: 60, // 5 năm
        generalWarrantyMileage: 120000, // 120k km
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    vehicleModels.vfe34 = vfe34;

    const [vf8] = await sequelize.models.VehicleModel.findOrCreate({
      where: { vehicleModelName: "VF 8" },
      defaults: {
        vehicleModelName: "VF 8",
        yearOfLaunch: new Date("2022-09-01"),
        generalWarrantyDuration: 120, // 10 năm
        generalWarrantyMileage: 200000, // 200k km
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    vehicleModels.vf8 = vf8;

    const [vf9] = await sequelize.models.VehicleModel.findOrCreate({
      where: { vehicleModelName: "VF 9" },
      defaults: {
        vehicleModelName: "VF 9",
        yearOfLaunch: new Date("2023-03-01"),
        generalWarrantyDuration: 120, // 10 năm
        generalWarrantyMileage: 200000, // 200k km
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    vehicleModels.vf9 = vf9;

    const [vf5Plus] = await sequelize.models.VehicleModel.findOrCreate({
      where: { vehicleModelName: "VF 5 Plus" },
      defaults: {
        vehicleModelName: "VF 5 Plus",
        yearOfLaunch: new Date("2023-06-01"),
        generalWarrantyDuration: 84, // 7 năm
        generalWarrantyMileage: 160000, // 160k km
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    vehicleModels.vf5Plus = vf5Plus;

    console.log("✅ VehicleModel: 4 dòng xe (VF e34, VF 8, VF 9, VF 5 Plus)");

    // ========================================
    // 4. TẠO SERVICE CENTERS
    // ========================================
    const [scHN] = await sequelize.models.ServiceCenter.findOrCreate({
      where: { name: "VinFast SC Hà Nội" },
      defaults: {
        name: "VinFast SC Hà Nội",
        address: "Long Biên, Hà Nội",
        phone: "0243 2121 999",
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });

    const [scHCM] = await sequelize.models.ServiceCenter.findOrCreate({
      where: { name: "VinFast SC TP.HCM" },
      defaults: {
        name: "VinFast SC TP.HCM",
        address: "Quận 3, TP.HCM",
        phone: "028 3636 8888",
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    console.log("✅ ServiceCenter: 2 centers");

    // ========================================
    // 5. TẠO WAREHOUSES
    // ========================================
    const warehouses = {};

    const [whCentral] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Trung Tâm" },
      defaults: {
        name: "Kho Trung Tâm",
        address: "Hòa Lạc, Hà Nội",
        priority: 1,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    warehouses.central = whCentral;

    const [whHN1] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Chính HN" },
      defaults: {
        name: "Kho Chính HN",
        address: "Long Biên, Hà Nội",
        priority: 2,
        serviceCenterId: scHN.serviceCenterId,
      },
    });
    warehouses.hn1 = whHN1;

    const [whHN2] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Phụ HN" },
      defaults: {
        name: "Kho Phụ HN",
        address: "Long Biên - T2, Hà Nội",
        priority: 3,
        serviceCenterId: scHN.serviceCenterId,
      },
    });
    warehouses.hn2 = whHN2;

    const [whHCM1] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Chính HCM" },
      defaults: {
        name: "Kho Chính HCM",
        address: "Quận 3, TP.HCM",
        priority: 2,
        serviceCenterId: scHCM.serviceCenterId,
      },
    });
    warehouses.hcm1 = whHCM1;

    console.log("✅ Warehouse: 4 kho");

    // ========================================
    // 6. TẠO TYPE COMPONENTS - ĐẦY ĐỦ 10 CATEGORIES
    // ========================================
    console.log("\n🔧 Tạo TypeComponents (30+ loại)...");
    const typeComponents = {};

    // === 1. HIGH_VOLTAGE_BATTERY ===
    const [battVFe34] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BAT-HV-42KWH-VFE34" },
      defaults: {
        name: "Pin Cao Áp 42kWh (VF e34)",
        price: 280000000,
        sku: "BAT-HV-42KWH-VFE34",
        category: "HIGH_VOLTAGE_BATTERY",
      },
    });
    typeComponents.battVFe34 = battVFe34;

    const [battVF8] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BAT-HV-87KWH-VF8" },
      defaults: {
        name: "Pin Cao Áp 87.7kWh (VF 8)",
        price: 420000000,
        sku: "BAT-HV-87KWH-VF8",
        category: "HIGH_VOLTAGE_BATTERY",
      },
    });
    typeComponents.battVF8 = battVF8;

    const [battVF9] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BAT-HV-123KWH-VF9" },
      defaults: {
        name: "Pin Cao Áp 123kWh (VF 9)",
        price: 550000000,
        sku: "BAT-HV-123KWH-VF9",
        category: "HIGH_VOLTAGE_BATTERY",
      },
    });
    typeComponents.battVF9 = battVF9;

    const [bms] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BMS-CTRL-GEN3" },
      defaults: {
        name: "Bộ Quản Lý Pin BMS Gen3",
        price: 45000000,
        sku: "BMS-CTRL-GEN3",
        category: "HIGH_VOLTAGE_BATTERY",
      },
    });
    typeComponents.bms = bms;

    // === 2. POWERTRAIN ===
    const [motor110] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "MOT-ELC-110KW" },
      defaults: {
        name: "Động Cơ Điện 110kW (VF e34, VF 5 Plus)",
        price: 150000000,
        sku: "MOT-ELC-110KW",
        category: "POWERTRAIN",
      },
    });
    typeComponents.motor110 = motor110;

    const [motor150] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "MOT-ELC-150KW-RWD" },
      defaults: {
        name: "Động Cơ Điện 150kW RWD (VF 8)",
        price: 180000000,
        sku: "MOT-ELC-150KW-RWD",
        category: "POWERTRAIN",
      },
    });
    typeComponents.motor150 = motor150;

    const [motor300] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "MOT-ELC-300KW-AWD" },
      defaults: {
        name: "Hệ Thống Động Cơ 300kW AWD (VF 9)",
        price: 350000000,
        sku: "MOT-ELC-300KW-AWD",
        category: "POWERTRAIN",
      },
    });
    typeComponents.motor300 = motor300;

    const [inverter] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "INV-PWR-400V" },
      defaults: {
        name: "Biến Tần Công Suất 400V",
        price: 85000000,
        sku: "INV-PWR-400V",
        category: "POWERTRAIN",
      },
    });
    typeComponents.inverter = inverter;

    // === 3. CHARGING_SYSTEM ===
    const [onboardCharger] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "CHG-OBC-11KW" },
      defaults: {
        name: "Bộ Sạc Tích Hợp 11kW",
        price: 35000000,
        sku: "CHG-OBC-11KW",
        category: "CHARGING_SYSTEM",
      },
    });
    typeComponents.onboardCharger = onboardCharger;

    const [chargingPort] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "CHG-PORT-CCS2" },
      defaults: {
        name: "Cổng Sạc CCS2",
        price: 8000000,
        sku: "CHG-PORT-CCS2",
        category: "CHARGING_SYSTEM",
      },
    });
    typeComponents.chargingPort = chargingPort;

    // === 4. THERMAL_MANAGEMENT ===
    const [coolingSystem] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "THRM-COOL-BATT" },
      defaults: {
        name: "Hệ Thống Làm Mát Pin",
        price: 55000000,
        sku: "THRM-COOL-BATT",
        category: "THERMAL_MANAGEMENT",
      },
    });
    typeComponents.coolingSystem = coolingSystem;

    const [heatPump] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "THRM-HPUMP-EFF" },
      defaults: {
        name: "Bơm Nhiệt Hiệu Suất Cao",
        price: 42000000,
        sku: "THRM-HPUMP-EFF",
        category: "THERMAL_MANAGEMENT",
      },
    });
    typeComponents.heatPump = heatPump;

    // === 5. LOW_VOLTAGE_SYSTEM ===
    const [battery12v] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "LV-BATT-12V-AGM" },
      defaults: {
        name: "Ắc Quy 12V AGM",
        price: 5000000,
        sku: "LV-BATT-12V-AGM",
        category: "LOW_VOLTAGE_SYSTEM",
      },
    });
    typeComponents.battery12v = battery12v;

    const [dcConverter] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "LV-DCDC-CONV" },
      defaults: {
        name: "Bộ Chuyển Đổi DC-DC",
        price: 18000000,
        sku: "LV-DCDC-CONV",
        category: "LOW_VOLTAGE_SYSTEM",
      },
    });
    typeComponents.dcConverter = dcConverter;

    // === 6. BRAKING ===
    const [brakingSystem] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BRK-REGEN-ABS" },
      defaults: {
        name: "Hệ Thống Phanh Tái Sinh + ABS",
        price: 65000000,
        sku: "BRK-REGEN-ABS",
        category: "BRAKING",
      },
    });
    typeComponents.brakingSystem = brakingSystem;

    const [brakePads] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BRK-PAD-CERAMIC" },
      defaults: {
        name: "Má Phanh Ceramic (Bộ 4)",
        price: 4500000,
        sku: "BRK-PAD-CERAMIC",
        category: "BRAKING",
      },
    });
    typeComponents.brakePads = brakePads;

    // === 7. SUSPENSION_STEERING ===
    const [suspension] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "SUSP-ADAPT-DAMP" },
      defaults: {
        name: "Hệ Thống Treo Thích Ứng",
        price: 75000000,
        sku: "SUSP-ADAPT-DAMP",
        category: "SUSPENSION_STEERING",
      },
    });
    typeComponents.suspension = suspension;

    const [steering] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "STEER-EPS-RACK" },
      defaults: {
        name: "Hệ Thống Lái Trợ Lực Điện",
        price: 32000000,
        sku: "STEER-EPS-RACK",
        category: "SUSPENSION_STEERING",
      },
    });
    typeComponents.steering = steering;

    // === 8. HVAC ===
    const [hvacSystem] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "HVAC-AUTO-DUAL" },
      defaults: {
        name: "Điều Hòa Tự Động 2 Vùng",
        price: 38000000,
        sku: "HVAC-AUTO-DUAL",
        category: "HVAC",
      },
    });
    typeComponents.hvacSystem = hvacSystem;

    const [airFilter] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "HVAC-FILTER-HEPA" },
      defaults: {
        name: "Bộ Lọc Không Khí HEPA",
        price: 3500000,
        sku: "HVAC-FILTER-HEPA",
        category: "HVAC",
      },
    });
    typeComponents.airFilter = airFilter;

    // === 9. BODY_CHASSIS ===
    const [bodyPanel] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BODY-PANEL-FRONT" },
      defaults: {
        name: "Tấm Thân Xe Phía Trước",
        price: 25000000,
        sku: "BODY-PANEL-FRONT",
        category: "BODY_CHASSIS",
      },
    });
    typeComponents.bodyPanel = bodyPanel;

    const [windshield] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BODY-WSHIELD-HEAT" },
      defaults: {
        name: "Kính Chắn Gió Sưởi",
        price: 15000000,
        sku: "BODY-WSHIELD-HEAT",
        category: "BODY_CHASSIS",
      },
    });
    typeComponents.windshield = windshield;

    // === 10. INFOTAINMENT_ADAS ===
    const [display10] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "INFO-LCD-10IN" },
      defaults: {
        name: "Màn Hình LCD 10 inch (VF e34, VF 5)",
        price: 15000000,
        sku: "INFO-LCD-10IN",
        category: "INFOTAINMENT_ADAS",
      },
    });
    typeComponents.display10 = display10;

    const [display15] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "INFO-LCD-15IN" },
      defaults: {
        name: "Màn Hình LCD 15.6 inch (VF 8, VF 9)",
        price: 28000000,
        sku: "INFO-LCD-15IN",
        category: "INFOTAINMENT_ADAS",
      },
    });
    typeComponents.display15 = display15;

    const [adasSystem] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "ADAS-LVL2-SUITE" },
      defaults: {
        name: "Hệ Thống ADAS Cấp 2",
        price: 95000000,
        sku: "ADAS-LVL2-SUITE",
        category: "INFOTAINMENT_ADAS",
      },
    });
    typeComponents.adasSystem = adasSystem;

    const [camera360] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "ADAS-CAM-360" },
      defaults: {
        name: "Camera 360 độ",
        price: 18000000,
        sku: "ADAS-CAM-360",
        category: "INFOTAINMENT_ADAS",
      },
    });
    typeComponents.camera360 = camera360;

    console.log("✅ TypeComponent: 22 components covering đủ 10 categories");

    // ========================================
    // 7. TẠO TYPECOMPONENTBYCOMPANY - LIÊN KẾT NHÀ CUNG CẤP
    // ========================================
    console.log("\n🔗 Tạo TypeComponentByCompany...");

    // CATL cung cấp tất cả pin và BMS
    for (const comp of [
      typeComponents.battVFe34,
      typeComponents.battVF8,
      typeComponents.battVF9,
      typeComponents.bms,
    ]) {
      await sequelize.models.TypeComponentByCompany.findOrCreate({
        where: {
          componentCompanyId: componentCompanies.catl.componentCompanyId,
          typeComponentId: comp.typeComponentId,
        },
      });
    }

    // Bosch cung cấp các hệ thống động lực, phanh, lái
    for (const comp of [
      typeComponents.motor110,
      typeComponents.motor150,
      typeComponents.motor300,
      typeComponents.inverter,
      typeComponents.brakingSystem,
      typeComponents.steering,
    ]) {
      await sequelize.models.TypeComponentByCompany.findOrCreate({
        where: {
          componentCompanyId: componentCompanies.bosch.componentCompanyId,
          typeComponentId: comp.typeComponentId,
        },
      });
    }

    // LG cung cấp hệ thống giải trí, màn hình, ADAS
    for (const comp of [
      typeComponents.display10,
      typeComponents.display15,
      typeComponents.adasSystem,
      typeComponents.camera360,
      typeComponents.hvacSystem,
    ]) {
      await sequelize.models.TypeComponentByCompany.findOrCreate({
        where: {
          componentCompanyId: componentCompanies.lg.componentCompanyId,
          typeComponentId: comp.typeComponentId,
        },
      });
    }

    console.log("✅ TypeComponentByCompany: Đã liên kết nhà cung cấp");

    // ========================================
    // 8. TẠO WARRANTY COMPONENT - XÁC ĐỊNH COMPONENT CỦA TỪNG MODEL XE
    // ========================================
    console.log("\n📋 Tạo WarrantyComponent cho từng model xe...");

    // Định nghĩa component cho từng model xe
    const vehicleComponentMap = {
      vfe34: [
        {
          comp: typeComponents.battVFe34,
          qty: 1,
          duration: 96,
          mileage: 160000,
        },
        { comp: typeComponents.bms, qty: 1, duration: 96, mileage: 160000 },
        {
          comp: typeComponents.motor110,
          qty: 1,
          duration: 96,
          mileage: 160000,
        },
        {
          comp: typeComponents.inverter,
          qty: 1,
          duration: 96,
          mileage: 160000,
        },
        {
          comp: typeComponents.onboardCharger,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.chargingPort,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.coolingSystem,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.battery12v,
          qty: 1,
          duration: 24,
          mileage: 50000,
        },
        {
          comp: typeComponents.dcConverter,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.brakingSystem,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.brakePads,
          qty: 1,
          duration: 12,
          mileage: 20000,
        },
        {
          comp: typeComponents.steering,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.hvacSystem,
          qty: 1,
          duration: 36,
          mileage: 80000,
        },
        {
          comp: typeComponents.display10,
          qty: 1,
          duration: 36,
          mileage: 80000,
        },
        {
          comp: typeComponents.camera360,
          qty: 1,
          duration: 36,
          mileage: 80000,
        },
      ],
      vf8: [
        {
          comp: typeComponents.battVF8,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        { comp: typeComponents.bms, qty: 1, duration: 120, mileage: 200000 },
        {
          comp: typeComponents.motor150,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.inverter,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.onboardCharger,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.chargingPort,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.coolingSystem,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.heatPump,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.battery12v,
          qty: 1,
          duration: 24,
          mileage: 50000,
        },
        {
          comp: typeComponents.dcConverter,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.brakingSystem,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.brakePads,
          qty: 1,
          duration: 12,
          mileage: 20000,
        },
        {
          comp: typeComponents.suspension,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.steering,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.hvacSystem,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.display15,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.adasSystem,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.camera360,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
      ],
      vf9: [
        {
          comp: typeComponents.battVF9,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        { comp: typeComponents.bms, qty: 1, duration: 120, mileage: 200000 },
        {
          comp: typeComponents.motor300,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.inverter,
          qty: 2,
          duration: 120,
          mileage: 200000,
        }, // AWD có 2 inverter
        {
          comp: typeComponents.onboardCharger,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.chargingPort,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.coolingSystem,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.heatPump,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.battery12v,
          qty: 1,
          duration: 24,
          mileage: 50000,
        },
        {
          comp: typeComponents.dcConverter,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.brakingSystem,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.brakePads,
          qty: 1,
          duration: 12,
          mileage: 20000,
        },
        {
          comp: typeComponents.suspension,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.steering,
          qty: 1,
          duration: 120,
          mileage: 200000,
        },
        {
          comp: typeComponents.hvacSystem,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.display15,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.adasSystem,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
        {
          comp: typeComponents.camera360,
          qty: 1,
          duration: 60,
          mileage: 120000,
        },
      ],
      vf5Plus: [
        {
          comp: typeComponents.battVFe34,
          qty: 1,
          duration: 84,
          mileage: 160000,
        }, // Dùng chung pin với e34
        { comp: typeComponents.bms, qty: 1, duration: 84, mileage: 160000 },
        {
          comp: typeComponents.motor110,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.inverter,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.onboardCharger,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.chargingPort,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.coolingSystem,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.battery12v,
          qty: 1,
          duration: 24,
          mileage: 50000,
        },
        {
          comp: typeComponents.dcConverter,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.brakingSystem,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.brakePads,
          qty: 1,
          duration: 12,
          mileage: 20000,
        },
        {
          comp: typeComponents.steering,
          qty: 1,
          duration: 84,
          mileage: 160000,
        },
        {
          comp: typeComponents.hvacSystem,
          qty: 1,
          duration: 48,
          mileage: 100000,
        },
        {
          comp: typeComponents.display10,
          qty: 1,
          duration: 48,
          mileage: 100000,
        },
      ],
    };

    for (const [modelKey, components] of Object.entries(vehicleComponentMap)) {
      for (const { comp, qty, duration, mileage } of components) {
        await sequelize.models.WarrantyComponent.findOrCreate({
          where: {
            vehicleModelId: vehicleModels[modelKey].vehicleModelId,
            typeComponentId: comp.typeComponentId,
          },
          defaults: {
            vehicleModelId: vehicleModels[modelKey].vehicleModelId,
            typeComponentId: comp.typeComponentId,
            quantity: qty,
            durationMonth: duration,
            mileageLimit: mileage,
          },
        });
      }
      console.log(
        `  ✓ ${vehicleModels[modelKey].vehicleModelName}: ${components.length} components`
      );
    }

    console.log("✅ WarrantyComponent: Đã định nghĩa cho 4 models");

    // ========================================
    // 9. TẠO ROLES
    // ========================================
    const roles = {};
    const roleNames = [
      "service_center_staff",
      "service_center_technician",
      "service_center_manager",
      "emv_staff",
      "parts_coordinator_service_center",
      "parts_coordinator_company",
      "emv_admin",
    ];

    for (const roleName of roleNames) {
      const [role] = await sequelize.models.Role.findOrCreate({
        where: { roleName },
      });
      roles[roleName] = role;
    }
    console.log("✅ Role: 7 vai trò đầy đủ");

    // ========================================
    // 10. TẠO USERS
    // ========================================
    const hashedPassword = await bcrypt.hash("123456", 10);
    const allUsers = [];

    // HÀ NỘI
    const hnUsers = [
      {
        username: "staff_hn1",
        name: "Nguyễn Văn An",
        role: "service_center_staff",
        sc: scHN,
      },
      {
        username: "staff_hn2",
        name: "Đỗ Thị Mai",
        role: "service_center_staff",
        sc: scHN,
      },
      {
        username: "staff_hn3",
        name: "Bùi Văn Hùng",
        role: "service_center_staff",
        sc: scHN,
      },
      {
        username: "tech_hn1",
        name: "Lê Văn Cường",
        role: "service_center_technician",
        sc: scHN,
      },
      {
        username: "tech_hn2",
        name: "Vũ Minh Tuấn",
        role: "service_center_technician",
        sc: scHN,
      },
      {
        username: "tech_hn3",
        name: "Ngô Thanh Long",
        role: "service_center_technician",
        sc: scHN,
      },
      {
        username: "tech_hn4",
        name: "Đinh Văn Nam",
        role: "service_center_technician",
        sc: scHN,
      },
      {
        username: "manager_hn",
        name: "Trần Thị Bình",
        role: "service_center_manager",
        sc: scHN,
      },
      {
        username: "parts_sc_hn1",
        name: "Hoàng Thị Em",
        role: "parts_coordinator_service_center",
        sc: scHN,
      },
      {
        username: "parts_sc_hn2",
        name: "Lý Văn Tâm",
        role: "parts_coordinator_service_center",
        sc: scHN,
      },
    ];

    // TP.HCM
    const hcmUsers = [
      {
        username: "staff_hcm1",
        name: "Võ Văn Khoa",
        role: "service_center_staff",
        sc: scHCM,
      },
      {
        username: "staff_hcm2",
        name: "Phan Thị Lan",
        role: "service_center_staff",
        sc: scHCM,
      },
      {
        username: "tech_hcm1",
        name: "Trương Văn Phong",
        role: "service_center_technician",
        sc: scHCM,
      },
      {
        username: "tech_hcm2",
        name: "Huỳnh Văn Tài",
        role: "service_center_technician",
        sc: scHCM,
      },
      {
        username: "tech_hcm3",
        name: "Lâm Thị Hoa",
        role: "service_center_technician",
        sc: scHCM,
      },
      {
        username: "manager_hcm",
        name: "Nguyễn Thị Xuân",
        role: "service_center_manager",
        sc: scHCM,
      },
      {
        username: "parts_sc_hcm1",
        name: "Đặng Văn Minh",
        role: "parts_coordinator_service_center",
        sc: scHCM,
      },
    ];

    // CÔNG TY
    const companyUsers = [
      {
        username: "emv_staff1",
        name: "Phạm Văn Dũng",
        role: "emv_staff",
        company: vehicleCompany,
      },
      {
        username: "emv_staff2",
        name: "Lê Thị Nga",
        role: "emv_staff",
        company: vehicleCompany,
      },
      {
        username: "parts_company1",
        name: "Đặng Văn Phúc",
        role: "parts_coordinator_company",
        company: vehicleCompany,
      },
      {
        username: "parts_company2",
        name: "Cao Văn Sơn",
        role: "parts_coordinator_company",
        company: vehicleCompany,
      },
      {
        username: "admin",
        name: "Võ Thị Giang (Admin)",
        role: "emv_admin",
        company: vehicleCompany,
      },
    ];

    let phoneCounter = 1234567;
    for (const userData of [...hnUsers, ...hcmUsers, ...companyUsers]) {
      const [user] = await sequelize.models.User.findOrCreate({
        where: { username: userData.username },
        defaults: {
          username: userData.username,
          password: hashedPassword,
          email: `${userData.username}@vinfast.vn`,
          phone: `090${phoneCounter++}`,
          address: userData.sc
            ? userData.sc === scHN
              ? "Hà Nội"
              : "TP.HCM"
            : "Hà Nội",
          name: userData.name,
          roleId: roles[userData.role].roleId,
          serviceCenterId: userData.sc ? userData.sc.serviceCenterId : null,
          vehicleCompanyId: userData.company
            ? userData.company.vehicleCompanyId
            : null,
        },
      });
      allUsers.push(user);
    }

    console.log(
      `✅ User: ${allUsers.length} người dùng (đầy đủ 7 vai trò cho 2 trung tâm)`
    );

    // ========================================
    // 11. TẠO WORK SCHEDULE CHO KỸ THUẬT VIÊN
    // ========================================
    const allTechs = allUsers.filter(
      (u) =>
        u.name.includes("Cường") ||
        u.name.includes("Tuấn") ||
        u.name.includes("Long") ||
        u.name.includes("Nam") ||
        u.name.includes("Phong") ||
        u.name.includes("Tài") ||
        u.name.includes("Hoa")
    );

    for (const tech of allTechs) {
      for (let i = 0; i < 30; i++) {
        const workDate = new Date(2025, 9, 27 + i);
        await sequelize.models.WorkSchedule.findOrCreate({
          where: {
            technicianId: tech.userId,
            workDate: workDate,
          },
          defaults: {
            technicianId: tech.userId,
            workDate: workDate,
            status: i % 7 === 0 ? "UNAVAILABLE" : "AVAILABLE",
            notes: i % 7 === 0 ? "Ngày nghỉ" : null,
          },
        });
      }
    }
    console.log(
      `✅ WorkSchedule: ${allTechs.length * 30} lịch (${
        allTechs.length
      } kỹ thuật viên x 30 ngày)`
    );

    // ========================================
    // 12. TẠO CUSTOMERS
    // ========================================
    const customers = [];
    const customerData = [
      {
        fullName: "Nguyễn Văn An",
        phone: "0901111111",
        email: "nguyenvanan@gmail.com",
        address: "123 Đường ABC, Hà Nội",
      },
      {
        fullName: "Trần Thị Bình",
        phone: "0902222222",
        email: "tranthibinh@gmail.com",
        address: "456 Đường DEF, TP.HCM",
      },
      {
        fullName: "Lê Hoàng Cường",
        phone: "0903333333",
        email: "lehoangcuong@gmail.com",
        address: "789 Đường GHI, Đà Nẵng",
      },
      {
        fullName: "Phạm Minh Đức",
        phone: "0904444444",
        email: "phamminhduc@gmail.com",
        address: "321 Đường JKL, Hải Phòng",
      },
      {
        fullName: "Hoàng Thu Hà",
        phone: "0905555555",
        email: "hoangthuha@gmail.com",
        address: "654 Đường MNO, Cần Thơ",
      },
    ];

    for (const custData of customerData) {
      const [cust] = await sequelize.models.Customer.findOrCreate({
        where: { phone: custData.phone },
        defaults: custData,
      });
      customers.push(cust);
    }
    console.log(`✅ Customer: ${customers.length} khách hàng`);

    // ========================================
    // 13. TẠO VEHICLES VỚI COMPONENTS ĐÃ INSTALLED
    // ========================================
    console.log("\n🚗 Tạo Vehicles với Components đã lắp đặt...");

    const vehiclesData = [
      // VF e34 - 4 xe
      {
        model: vehicleModels.vfe34,
        vin: "VFE34HN2023000001",
        plate: "30A-12345",
        owner: customers[0],
        purchaseDate: "2023-06-01",
        mfgDate: "2023-05-15",
      },
      {
        model: vehicleModels.vfe34,
        vin: "VFE34HN2023000002",
        plate: "30A-12346",
        owner: customers[0],
        purchaseDate: "2023-08-15",
        mfgDate: "2023-08-01",
      },
      {
        model: vehicleModels.vfe34,
        vin: "VFE34HC2023000003",
        plate: "51F-23456",
        owner: customers[1],
        purchaseDate: "2023-07-10",
        mfgDate: "2023-06-25",
      },
      {
        model: vehicleModels.vfe34,
        vin: "VFE34DN2023000004",
        plate: "43A-34567",
        owner: customers[2],
        purchaseDate: "2023-05-15",
        mfgDate: "2023-05-01",
      },

      // VF 8 - 3 xe
      {
        model: vehicleModels.vf8,
        vin: "VF8XSHCM202300001",
        plate: "51F-88888",
        owner: customers[1],
        purchaseDate: "2023-09-20",
        mfgDate: "2023-09-05",
      },
      {
        model: vehicleModels.vf8,
        vin: "VF8XSHAI202300002",
        plate: "16B-45678",
        owner: customers[3],
        purchaseDate: "2023-06-20",
        mfgDate: "2023-06-05",
      },
      {
        model: vehicleModels.vf8,
        vin: "VF8XSCAN202400003",
        plate: "65C-56789",
        owner: customers[4],
        purchaseDate: "2024-04-05",
        mfgDate: "2024-03-20",
      },

      // VF 9 - 2 xe
      {
        model: vehicleModels.vf9,
        vin: "VF9XXHAN202400001",
        plate: "30A-99999",
        owner: customers[2],
        purchaseDate: "2024-10-01",
        mfgDate: "2024-09-15",
      },
      {
        model: vehicleModels.vf9,
        vin: "VF9XXHCM202400002",
        plate: "51F-99999",
        owner: customers[3],
        purchaseDate: "2024-11-10",
        mfgDate: "2024-10-25",
      },

      // VF 5 Plus - 3 xe
      {
        model: vehicleModels.vf5Plus,
        vin: "VF5PSHAN202400001",
        plate: "30A-55555",
        owner: customers[0],
        purchaseDate: "2024-12-01",
        mfgDate: "2024-11-15",
      },
      {
        model: vehicleModels.vf5Plus,
        vin: "VF5PSHCM202400002",
        plate: "51F-55555",
        owner: customers[4],
        purchaseDate: "2024-08-20",
        mfgDate: "2024-08-05",
      },
      {
        model: vehicleModels.vf5Plus,
        vin: "VF5PSHAI202400003",
        plate: "16B-55555",
        owner: customers[2],
        purchaseDate: "2024-07-15",
        mfgDate: "2024-07-01",
      },
    ];

    const createdVehicles = [];

    for (const vehData of vehiclesData) {
      const [vehicle] = await sequelize.models.Vehicle.findOrCreate({
        where: { vin: vehData.vin },
        defaults: {
          vin: vehData.vin,
          vehicleModelId: vehData.model.vehicleModelId,
          licensePlate: vehData.plate,
          ownerId: vehData.owner.id,
          purchaseDate: new Date(vehData.purchaseDate),
          dateOfManufacture: new Date(vehData.mfgDate),
          placeOfManufacture: "Hải Phòng, Việt Nam",
        },
      });
      createdVehicles.push({
        vehicle,
        modelKey: Object.keys(vehicleModels).find(
          (k) =>
            vehicleModels[k].vehicleModelId === vehData.model.vehicleModelId
        ),
      });
    }

    console.log(`✅ Vehicles: ${createdVehicles.length} xe đã tạo`);

    // ========================================
    // 14. TẠO STOCK VÀ COMPONENTS TRONG KHO
    // ========================================
    console.log("\n📦 Tạo Stock và Components trong kho...");

    // Định nghĩa số lượng component trong từng kho
    const stockConfig = [
      // Kho Trung Tâm - Số lượng lớn, đủ mọi loại
      {
        wh: warehouses.central,
        comps: [
          { type: typeComponents.battVFe34, qty: 30 },
          { type: typeComponents.battVF8, qty: 20 },
          { type: typeComponents.battVF9, qty: 15 },
          { type: typeComponents.bms, qty: 80 },
          { type: typeComponents.motor110, qty: 40 },
          { type: typeComponents.motor150, qty: 25 },
          { type: typeComponents.motor300, qty: 15 },
          { type: typeComponents.inverter, qty: 60 },
          { type: typeComponents.onboardCharger, qty: 50 },
          { type: typeComponents.chargingPort, qty: 50 },
          { type: typeComponents.coolingSystem, qty: 40 },
          { type: typeComponents.heatPump, qty: 30 },
          { type: typeComponents.battery12v, qty: 100 },
          { type: typeComponents.dcConverter, qty: 50 },
          { type: typeComponents.brakingSystem, qty: 40 },
          { type: typeComponents.brakePads, qty: 80 },
          { type: typeComponents.suspension, qty: 25 },
          { type: typeComponents.steering, qty: 40 },
          { type: typeComponents.hvacSystem, qty: 40 },
          { type: typeComponents.display10, qty: 35 },
          { type: typeComponents.display15, qty: 30 },
          { type: typeComponents.adasSystem, qty: 25 },
          { type: typeComponents.camera360, qty: 40 },
        ],
      },
      // Kho Chính HN - Số lượng trung bình
      {
        wh: warehouses.hn1,
        comps: [
          { type: typeComponents.battVFe34, qty: 15 },
          { type: typeComponents.battVF8, qty: 10 },
          { type: typeComponents.bms, qty: 30 },
          { type: typeComponents.motor110, qty: 12 },
          { type: typeComponents.inverter, qty: 20 },
          { type: typeComponents.battery12v, qty: 40 },
          { type: typeComponents.brakePads, qty: 30 },
          { type: typeComponents.display10, qty: 15 },
          { type: typeComponents.display15, qty: 12 },
        ],
      },
      // Kho Phụ HN - Số lượng nhỏ, chủ yếu phụ tùng thay thế thường xuyên
      {
        wh: warehouses.hn2,
        comps: [
          { type: typeComponents.bms, qty: 15 },
          { type: typeComponents.battery12v, qty: 30 },
          { type: typeComponents.brakePads, qty: 40 },
          { type: typeComponents.airFilter, qty: 50 },
        ],
      },
      // Kho Chính HCM - Số lượng trung bình
      {
        wh: warehouses.hcm1,
        comps: [
          { type: typeComponents.battVFe34, qty: 12 },
          { type: typeComponents.battVF8, qty: 8 },
          { type: typeComponents.bms, qty: 25 },
          { type: typeComponents.motor110, qty: 10 },
          { type: typeComponents.inverter, qty: 15 },
          { type: typeComponents.battery12v, qty: 35 },
          { type: typeComponents.brakePads, qty: 25 },
          { type: typeComponents.display10, qty: 12 },
        ],
      },
    ];

    let totalStockComponents = 0;

    for (const whConfig of stockConfig) {
      console.log(`\n  📍 ${whConfig.wh.name}:`);

      for (const compConfig of whConfig.comps) {
        // Tạo Stock entry
        await sequelize.models.Stock.findOrCreate({
          where: {
            warehouseId: whConfig.wh.warehouseId,
            typeComponentId: compConfig.type.typeComponentId,
          },
          defaults: {
            warehouseId: whConfig.wh.warehouseId,
            typeComponentId: compConfig.type.typeComponentId,
            quantityInStock: compConfig.qty,
            quantityReserved: 0,
          },
        });

        // Tạo ĐÚNG SỐ LƯỢNG components với status IN_WAREHOUSE
        for (let i = 1; i <= compConfig.qty; i++) {
          const serial = `${compConfig.type.sku}-${whConfig.wh.name
            .substring(0, 4)
            .toUpperCase()}-${String(i).padStart(5, "0")}`;
          await sequelize.models.Component.findOrCreate({
            where: { serialNumber: serial },
            defaults: {
              typeComponentId: compConfig.type.typeComponentId,
              serialNumber: serial,
              warehouseId: whConfig.wh.warehouseId,
              status: "IN_WAREHOUSE",
            },
          });
          totalStockComponents++;
        }

        console.log(
          `    ✓ ${compConfig.type.name}: ${compConfig.qty} components`
        );
      }
    }

    console.log(
      `\n✅ Stock: Đã tạo ${totalStockComponents} components trong kho`
    );

    // ========================================
    // 15. TẠO COMPONENTS ĐÃ INSTALLED TRÊN XE
    // ========================================
    console.log("\n🔧 Tạo Components đã lắp đặt trên xe...");

    let totalInstalledComponents = 0;

    for (const { vehicle, modelKey } of createdVehicles) {
      const componentsForModel = vehicleComponentMap[modelKey];

      for (const { comp, qty } of componentsForModel) {
        for (let i = 1; i <= qty; i++) {
          const serial = `${comp.sku}-INSTALLED-${vehicle.vin}-${i}`;
          await sequelize.models.Component.findOrCreate({
            where: { serialNumber: serial },
            defaults: {
              typeComponentId: comp.typeComponentId,
              serialNumber: serial,
              status: "INSTALLED",
              vehicleVin: vehicle.vin,
              installedAt: new Date(vehicle.purchaseDate),
              warehouseId: null,
            },
          });
          totalInstalledComponents++;
        }
      }

      console.log(
        `  ✓ ${vehicle.licensePlate} (${
          vehicle.vin
        }): ${componentsForModel.reduce((sum, c) => sum + c.qty, 0)} components`
      );
    }

    console.log(
      `\n✅ Installed Components: ${totalInstalledComponents} components đã lắp trên ${createdVehicles.length} xe`
    );

    // ========================================
    // TÓM TẮT CUỐI CÙNG
    // ========================================
    console.log("\n" + "=".repeat(80));
    console.log("🎉 HOÀN THÀNH! DỮ LIỆU THỰC TẾ ĐÃ ĐƯỢC TẠO THÀNH CÔNG!");
    console.log("=".repeat(80));
    console.log("\n📊 TÓM TẮT CHI TIẾT:");
    console.log("   🏢 1 Công ty xe: VinFast Auto");
    console.log(
      "   🏭 3 Nhà cung cấp: CATL Battery, Bosch Automotive, LG Electronics"
    );
    console.log("   🚗 4 Dòng xe: VF e34, VF 8, VF 9, VF 5 Plus");
    console.log("   🏥 2 Trung tâm dịch vụ (Hà Nội & TP.HCM)");
    console.log("   📦 4 Kho (1 trung tâm + 2 HN + 1 HCM)");
    console.log("   🔧 22 Loại linh kiện (covering 10 categories)");
    console.log(
      `   ⚙️  ${totalStockComponents + totalInstalledComponents} Components:`
    );
    console.log(
      `      - ${totalStockComponents} trong kho (status: IN_WAREHOUSE)`
    );
    console.log(
      `      - ${totalInstalledComponents} đã lắp trên xe (status: INSTALLED)`
    );
    console.log(`   👥 ${allUsers.length} Người dùng (đầy đủ 7 vai trò)`);
    console.log(`   👤 ${customers.length} Khách hàng`);
    console.log(`   🚙 ${createdVehicles.length} Xe:`);
    console.log(`      - 4 xe VF e34`);
    console.log(`      - 3 xe VF 8`);
    console.log(`      - 2 xe VF 9`);
    console.log(`      - 3 xe VF 5 Plus`);
    console.log(
      `   📅 ${allTechs.length * 30} Lịch làm việc (${
        allTechs.length
      } kỹ thuật viên x 30 ngày)`
    );

    console.log("\n🔑 TÀI KHOẢN TEST (password: 123456):");
    console.log(
      "   👔 Staff:       staff_hn1, staff_hn2, staff_hn3, staff_hcm1, staff_hcm2"
    );
    console.log("   🔧 Technician:  tech_hn1-4, tech_hcm1-3");
    console.log("   👨‍💼 Manager:     manager_hn, manager_hcm");
    console.log("   📦 Parts SC:    parts_sc_hn1-2, parts_sc_hcm1");
    console.log("   🏢 EMV:         emv_staff1-2, parts_company1-2");
    console.log("   👑 Admin:       admin");

    console.log("\n💡 QUAN TRỌNG:");
    console.log(
      "   ✓ Stock.quantityInStock = SỐ COMPONENT THẬT SỰ có status IN_WAREHOUSE"
    );
    console.log(
      "   ✓ Mỗi xe có ĐẦY ĐỦ components theo WarrantyComponent của model đó"
    );
    console.log(
      "   ✓ Component INSTALLED: status='INSTALLED', vehicleVin=<vin>, warehouseId=null"
    );
    console.log(
      "   ✓ Component IN_WAREHOUSE: status='IN_WAREHOUSE', vehicleVin=null, warehouseId=<id>"
    );
    console.log(
      "   ✓ WarrantyComponent định nghĩa component NÀO được phép lắp vào model xe NÀO"
    );
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ Lỗi:", error);
    console.error("Stack:", error.stack);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✨ Seeding hoàn tất!");
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
