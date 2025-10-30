"use strict";

const { sequelize } = require("../models/index.cjs");
const bcrypt = require("bcrypt");

const TYPE_COMPONENTS_DATA = [
  {
    sku: "BAT-HV-42KWH-VFE34",
    name: "Pin cao áp 42 kWh (VF e34)",
    category: "HIGH_VOLTAGE_BATTERY",
    price: 280000000,
    makeBrand: "CATL",
    suppliers: ["catl"],
  },
  {
    sku: "BAT-HV-92KWH-VF8",
    name: "Pin cao áp 92 kWh (VF 8)",
    category: "HIGH_VOLTAGE_BATTERY",
    price: 420000000,
    makeBrand: "CATL",
    suppliers: ["catl"],
  },
  {
    sku: "MOT-ELC-130KW",
    name: "Động cơ điện 130 kW",
    category: "POWERTRAIN",
    price: 165000000,
    makeBrand: "Bosch",
    suppliers: ["bosch"],
  },
  {
    sku: "INV-PWR-400V",
    name: "Biến tần công suất 400V",
    category: "POWERTRAIN",
    price: 89000000,
    makeBrand: "Bosch",
    suppliers: ["bosch"],
  },
  {
    sku: "CHG-OBC-11KW",
    name: "Bộ sạc tích hợp 11 kW",
    category: "CHARGING_SYSTEM",
    price: 36000000,
    makeBrand: "Bosch",
    suppliers: ["bosch"],
  },
  {
    sku: "HVAC-AUTO-2ZONE",
    name: "Điều hòa tự động hai vùng",
    category: "HVAC",
    price: 39000000,
    makeBrand: "LG",
    suppliers: ["lg"],
  },
  {
    sku: "ADAS-CAM-360",
    name: "Camera 360 độ",
    category: "INFOTAINMENT_ADAS",
    price: 18500000,
    makeBrand: "LG",
    suppliers: ["lg"],
  },
  {
    sku: "DISPLAY-15IN",
    name: "Màn hình điều khiển 15 inch",
    category: "INFOTAINMENT_ADAS",
    price: 29500000,
    makeBrand: "LG",
    suppliers: ["lg"],
  },
  {
    sku: "BRAKE-PAD-CERAMIC",
    name: "Bộ má phanh gốm (4 bánh)",
    category: "BRAKING",
    price: 4800000,
    makeBrand: "Bosch",
    suppliers: ["bosch"],
  },
  {
    sku: "SUSP-AIR-ADAPTIVE",
    name: "Hệ thống treo khí nén thích ứng",
    category: "SUSPENSION_STEERING",
    price: 82000000,
    makeBrand: "Bosch",
    suppliers: ["bosch"],
  },
  {
    sku: "FILTER-CABIN-HEPA",
    name: "Lọc không khí HEPA khoang lái",
    category: "HVAC",
    price: 3600000,
    makeBrand: "LG",
    suppliers: ["lg"],
  },
  {
    sku: "BODY-WINDSHIELD-HEAT",
    name: "Kính chắn gió sưởi nhiệt",
    category: "BODY_CHASSIS",
    price: 16500000,
    makeBrand: "LG",
    suppliers: ["lg"],
  },
];

const STOCK_PLAN = [
  {
    key: "centralHub",
    code: "CENT",
    name: "Kho Trung Tâm",
    address: "Khu công nghệ cao Hòa Lạc, Hà Nội",
    priority: 1,
    items: [
      { sku: "BAT-HV-42KWH-VFE34", quantity: 18 },
      { sku: "BAT-HV-92KWH-VF8", quantity: 12 },
      { sku: "MOT-ELC-130KW", quantity: 16 },
      { sku: "INV-PWR-400V", quantity: 20 },
      { sku: "CHG-OBC-11KW", quantity: 20 },
      { sku: "HVAC-AUTO-2ZONE", quantity: 15 },
      { sku: "ADAS-CAM-360", quantity: 25 },
      { sku: "DISPLAY-15IN", quantity: 22 },
      { sku: "BRAKE-PAD-CERAMIC", quantity: 60 },
      { sku: "SUSP-AIR-ADAPTIVE", quantity: 10 },
      { sku: "FILTER-CABIN-HEPA", quantity: 80 },
      { sku: "BODY-WINDSHIELD-HEAT", quantity: 30 },
    ],
  },
  {
    key: "hanoiDepot",
    code: "HN01",
    name: "Kho Hà Nội - SC Long Biên",
    address: "Số 8 Nguyễn Văn Linh, Long Biên, Hà Nội",
    priority: 2,
    items: [
      { sku: "BAT-HV-42KWH-VFE34", quantity: 10 },
      { sku: "MOT-ELC-130KW", quantity: 8 },
      { sku: "INV-PWR-400V", quantity: 10 },
      { sku: "CHG-OBC-11KW", quantity: 10 },
      { sku: "HVAC-AUTO-2ZONE", quantity: 6 },
      { sku: "ADAS-CAM-360", quantity: 8 },
      { sku: "BRAKE-PAD-CERAMIC", quantity: 30 },
      { sku: "FILTER-CABIN-HEPA", quantity: 40 },
      { sku: "BODY-WINDSHIELD-HEAT", quantity: 12 },
    ],
  },
  {
    key: "hcmDepot",
    code: "HCM1",
    name: "Kho TP.HCM - SC Quận 7",
    address: "Nguyễn Văn Linh, Quận 7, TP.HCM",
    priority: 2,
    items: [
      { sku: "BAT-HV-42KWH-VFE34", quantity: 8 },
      { sku: "BAT-HV-92KWH-VF8", quantity: 8 },
      { sku: "MOT-ELC-130KW", quantity: 6 },
      { sku: "INV-PWR-400V", quantity: 8 },
      { sku: "CHG-OBC-11KW", quantity: 8 },
      { sku: "ADAS-CAM-360", quantity: 12 },
      { sku: "DISPLAY-15IN", quantity: 10 },
      { sku: "BRAKE-PAD-CERAMIC", quantity: 24 },
      { sku: "FILTER-CABIN-HEPA", quantity: 36 },
      { sku: "BODY-WINDSHIELD-HEAT", quantity: 10 },
    ],
  },
];

const VEHICLE_MODELS_DATA = [
  {
    key: "vfE34",
    vehicleModelName: "VF e34",
    yearOfLaunch: new Date("2021-12-01"),
    generalWarrantyDuration: 60,
    generalWarrantyMileage: 120000,
  },
  {
    key: "vf8",
    vehicleModelName: "VF 8",
    yearOfLaunch: new Date("2022-10-01"),
    generalWarrantyDuration: 120,
    generalWarrantyMileage: 200000,
  },
  {
    key: "vf9",
    vehicleModelName: "VF 9",
    yearOfLaunch: new Date("2023-03-01"),
    generalWarrantyDuration: 120,
    generalWarrantyMileage: 200000,
  },
];

const WARRANTY_COMPONENT_PLAN = {
  vfE34: [
    {
      sku: "BAT-HV-42KWH-VFE34",
      quantity: 1,
      durationMonth: 96,
      mileageLimit: 160000,
    },
    {
      sku: "MOT-ELC-130KW",
      quantity: 1,
      durationMonth: 96,
      mileageLimit: 160000,
    },
    {
      sku: "INV-PWR-400V",
      quantity: 1,
      durationMonth: 96,
      mileageLimit: 160000,
    },
    {
      sku: "CHG-OBC-11KW",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 140000,
    },
    {
      sku: "HVAC-AUTO-2ZONE",
      quantity: 1,
      durationMonth: 48,
      mileageLimit: 90000,
    },
    {
      sku: "ADAS-CAM-360",
      quantity: 1,
      durationMonth: 48,
      mileageLimit: 90000,
    },
    {
      sku: "BRAKE-PAD-CERAMIC",
      quantity: 1,
      durationMonth: 12,
      mileageLimit: 20000,
    },
    {
      sku: "FILTER-CABIN-HEPA",
      quantity: 1,
      durationMonth: 6,
      mileageLimit: 10000,
    },
  ],
  vf8: [
    {
      sku: "BAT-HV-92KWH-VF8",
      quantity: 1,
      durationMonth: 120,
      mileageLimit: 200000,
    },
    {
      sku: "MOT-ELC-130KW",
      quantity: 2,
      durationMonth: 120,
      mileageLimit: 200000,
    },
    {
      sku: "INV-PWR-400V",
      quantity: 2,
      durationMonth: 120,
      mileageLimit: 200000,
    },
    {
      sku: "CHG-OBC-11KW",
      quantity: 1,
      durationMonth: 96,
      mileageLimit: 180000,
    },
    {
      sku: "HVAC-AUTO-2ZONE",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "ADAS-CAM-360",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "DISPLAY-15IN",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "BRAKE-PAD-CERAMIC",
      quantity: 1,
      durationMonth: 18,
      mileageLimit: 30000,
    },
    {
      sku: "SUSP-AIR-ADAPTIVE",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 150000,
    },
  ],
  vf9: [
    {
      sku: "BAT-HV-92KWH-VF8",
      quantity: 1,
      durationMonth: 120,
      mileageLimit: 200000,
    },
    {
      sku: "MOT-ELC-130KW",
      quantity: 2,
      durationMonth: 120,
      mileageLimit: 200000,
    },
    {
      sku: "INV-PWR-400V",
      quantity: 2,
      durationMonth: 120,
      mileageLimit: 200000,
    },
    {
      sku: "CHG-OBC-11KW",
      quantity: 1,
      durationMonth: 96,
      mileageLimit: 180000,
    },
    {
      sku: "HVAC-AUTO-2ZONE",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "ADAS-CAM-360",
      quantity: 2,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "DISPLAY-15IN",
      quantity: 2,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "SUSP-AIR-ADAPTIVE",
      quantity: 1,
      durationMonth: 72,
      mileageLimit: 150000,
    },
    {
      sku: "BODY-WINDSHIELD-HEAT",
      quantity: 1,
      durationMonth: 36,
      mileageLimit: 60000,
    },
  ],
};

const ROLE_NAMES = [
  "service_center_staff",
  "service_center_technician",
  "service_center_manager",
  "parts_coordinator_service_center",
  "parts_coordinator_company",
  "emv_staff",
  "emv_admin",
];

const CUSTOMER_DATA = [
  {
    fullName: "Trần Hoàng Nam",
    phone: "0901112233",
    email: "nam.thn@example.com",
    address: "Time City, Hà Nội",
  },
  {
    fullName: "Nguyễn Thu Trang",
    phone: "0902223344",
    email: "trang.nguyen@example.com",
    address: "Quận 7, TP.HCM",
  },
  {
    fullName: "Lê Minh Quân",
    phone: "0903334455",
    email: "quan.le@example.com",
    address: "Hải Phòng",
  },
];

const VEHICLE_DATA = [
  {
    vin: "VFE34VN2024A0001",
    licensePlate: "30A-45678",
    modelKey: "vfE34",
    ownerPhone: "0901112233",
    purchaseDate: new Date("2024-01-18"),
    dateOfManufacture: new Date("2023-12-20"),
  },
  {
    vin: "VF8VN2024B0002",
    licensePlate: "51H-67890",
    modelKey: "vf8",
    ownerPhone: "0902223344",
    purchaseDate: new Date("2024-03-05"),
    dateOfManufacture: new Date("2024-02-12"),
  },
  {
    vin: "VF9VN2024C0003",
    licensePlate: "15A-78901",
    modelKey: "vf9",
    ownerPhone: "0903334455",
    purchaseDate: new Date("2024-05-22"),
    dateOfManufacture: new Date("2024-04-30"),
  },
];

function createSerialNumber({ sku, warehouseCode, index }) {
  return `${sku}-${warehouseCode}-${String(index).padStart(4, "0")}`;
}

async function seedDatabase() {
  const transaction = await sequelize.transaction();
  try {
    const models = sequelize.models;
    const {
      VehicleCompany,
      ComponentCompany,
      VehicleModel,
      ServiceCenter,
      Warehouse,
      TypeComponent,
      TypeComponentByCompany,
      WarrantyComponent,
      Role,
      User,
      Customer,
      Vehicle,
      Stock,
      Component,
    } = models;

    console.log("🌱 Bắt đầu seed dữ liệu thực tế...");

    const [vehicleCompany] = await VehicleCompany.findOrCreate({
      where: { name: "VinFast Auto" },
      defaults: {
        name: "VinFast Auto",
        address: "Hải Phòng, Việt Nam",
        phone: "1900232389",
        email: "contact@vinfastauto.com",
      },
      transaction,
    });

    const componentCompanies = {};
    const componentCompanyData = [
      {
        key: "catl",
        name: "CATL Battery",
        address: "Ningde, Trung Quốc",
        phone: "+86-593-8988888",
        email: "info@catl.com",
      },
      {
        key: "bosch",
        name: "Bosch Automotive",
        address: "Stuttgart, Đức",
        phone: "+49-711-811-0",
        email: "contact@bosch.com",
      },
      {
        key: "lg",
        name: "LG Electronics",
        address: "Seoul, Hàn Quốc",
        phone: "+82-2-3777-1114",
        email: "info@lge.com",
      },
    ];

    for (const data of componentCompanyData) {
      const [record] = await ComponentCompany.findOrCreate({
        where: { name: data.name },
        defaults: data,
        transaction,
      });
      componentCompanies[data.key] = record;
    }

    const vehicleModels = {};
    for (const data of VEHICLE_MODELS_DATA) {
      const [record] = await VehicleModel.findOrCreate({
        where: { vehicleModelName: data.vehicleModelName },
        defaults: {
          ...data,
          vehicleCompanyId: vehicleCompany.vehicleCompanyId,
        },
        transaction,
      });
      vehicleModels[data.key] = record;
    }

    const serviceCenters = {};
    const warehouses = {};

    const [serviceCenterHN] = await ServiceCenter.findOrCreate({
      where: { name: "VinFast Service Center Hà Nội" },
      defaults: {
        name: "VinFast Service Center Hà Nội",
        address: "Long Biên, Hà Nội",
        phone: "024-789-8888",
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
      transaction,
    });
    serviceCenters.hanoi = serviceCenterHN;

    const [serviceCenterHCM] = await ServiceCenter.findOrCreate({
      where: { name: "VinFast Service Center TP.HCM" },
      defaults: {
        name: "VinFast Service Center TP.HCM",
        address: "Quận 7, TP.HCM",
        phone: "028-567-9999",
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
      transaction,
    });
    serviceCenters.hcm = serviceCenterHCM;

    for (const stockInfo of STOCK_PLAN) {
      const defaults = {
        name: stockInfo.name,
        address: stockInfo.address,
        priority: stockInfo.priority,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
        serviceCenterId:
          stockInfo.key === "centralHub"
            ? null
            : stockInfo.key === "hanoiDepot"
            ? serviceCenterHN.serviceCenterId
            : serviceCenterHCM.serviceCenterId,
      };

      const [warehouse] = await Warehouse.findOrCreate({
        where: { name: stockInfo.name },
        defaults,
        transaction,
      });

      warehouses[stockInfo.key] = {
        ...warehouse.get({ plain: true }),
        code: stockInfo.code,
      };
    }

    const typeComponents = {};
    for (const data of TYPE_COMPONENTS_DATA) {
      const [record] = await TypeComponent.findOrCreate({
        where: { sku: data.sku },
        defaults: {
          name: data.name,
          price: data.price,
          sku: data.sku,
          category: data.category,
          makeBrand: data.makeBrand,
        },
        transaction,
      });
      typeComponents[data.sku] = record;

      for (const supplierKey of data.suppliers) {
        const supplier = componentCompanies[supplierKey];
        await TypeComponentByCompany.findOrCreate({
          where: {
            componentCompanyId: supplier.componentCompanyId,
            typeComponentId: record.typeComponentId,
          },
          defaults: {
            componentCompanyId: supplier.componentCompanyId,
            typeComponentId: record.typeComponentId,
          },
          transaction,
        });
      }
    }

    for (const [modelKey, items] of Object.entries(WARRANTY_COMPONENT_PLAN)) {
      const model = vehicleModels[modelKey];
      for (const item of items) {
        const componentRecord = typeComponents[item.sku];
        await WarrantyComponent.findOrCreate({
          where: {
            vehicleModelId: model.vehicleModelId,
            typeComponentId: componentRecord.typeComponentId,
          },
          defaults: {
            vehicleModelId: model.vehicleModelId,
            typeComponentId: componentRecord.typeComponentId,
            quantity: item.quantity,
            durationMonth: item.durationMonth,
            mileageLimit: item.mileageLimit,
          },
          transaction,
        });
      }
    }

    const roles = {};
    for (const roleName of ROLE_NAMES) {
      const [record] = await Role.findOrCreate({
        where: { roleName },
        defaults: { roleName },
        transaction,
      });
      roles[roleName] = record;
    }

    const hashedPassword = await bcrypt.hash("123456", 10);
    const userPayload = [
      {
        username: "staff_hn",
        name: "Nguyễn Lan Anh",
        role: "service_center_staff",
        serviceCenterId: serviceCenterHN.serviceCenterId,
      },
      {
        username: "tech_hn",
        name: "Phạm Đức Trung",
        role: "service_center_technician",
        serviceCenterId: serviceCenterHN.serviceCenterId,
      },
      {
        username: "staff_hcm",
        name: "Trần Mỹ Duyên",
        role: "service_center_staff",
        serviceCenterId: serviceCenterHCM.serviceCenterId,
      },
      {
        username: "tech_hcm",
        name: "Lê Quốc Bảo",
        role: "service_center_technician",
        serviceCenterId: serviceCenterHCM.serviceCenterId,
      },
      {
        username: "parts_company",
        name: "Đỗ Hữu Minh",
        role: "parts_coordinator_company",
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
      {
        username: "admin",
        name: "Võ Minh Giang",
        role: "emv_admin",
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    ];

    for (const [index, user] of userPayload.entries()) {
      await User.findOrCreate({
        where: { username: user.username },
        defaults: {
          username: user.username,
          password: hashedPassword,
          name: user.name,
          email: `${user.username}@vinfast.vn`,
          phone: `0907${String(index + 1).padStart(4, "0")}`,
          address: user.serviceCenterId ? "Trung tâm dịch vụ" : "Trụ sở chính",
          roleId: roles[user.role].roleId,
          serviceCenterId: user.serviceCenterId ?? null,
          vehicleCompanyId: user.vehicleCompanyId ?? null,
        },
        transaction,
      });
    }

    const customers = {};
    for (const data of CUSTOMER_DATA) {
      const [record] = await Customer.findOrCreate({
        where: { phone: data.phone },
        defaults: data,
        transaction,
      });
      customers[data.phone] = record;
    }

    const vehicles = [];
    for (const data of VEHICLE_DATA) {
      const model = vehicleModels[data.modelKey];
      const owner = customers[data.ownerPhone];
      const [vehicle] = await Vehicle.findOrCreate({
        where: { vin: data.vin },
        defaults: {
          vin: data.vin,
          vehicleModelId: model.vehicleModelId,
          licensePlate: data.licensePlate,
          ownerId: owner.id,
          purchaseDate: data.purchaseDate,
          dateOfManufacture: data.dateOfManufacture,
          placeOfManufacture: "Nhà máy Hải Phòng",
        },
        transaction,
      });
      vehicles.push(vehicle);
    }

    let createdComponentsInWarehouses = 0;

    for (const stockInfo of STOCK_PLAN) {
      const warehouse = warehouses[stockInfo.key];

      for (const item of stockInfo.items) {
        const componentRecord = typeComponents[item.sku];

        for (let i = 1; i <= item.quantity; i += 1) {
          const serialNumber = createSerialNumber({
            sku: item.sku,
            warehouseCode: warehouse.code,
            index: i,
          });

          await Component.findOrCreate({
            where: { serialNumber },
            defaults: {
              typeComponentId: componentRecord.typeComponentId,
              serialNumber,
              warehouseId: warehouse.warehouseId,
              status: "IN_WAREHOUSE",
            },
            transaction,
          });
        }

        const quantityInWarehouse = await Component.count({
          where: {
            warehouseId: warehouse.warehouseId,
            typeComponentId: componentRecord.typeComponentId,
            status: "IN_WAREHOUSE",
          },
          transaction,
        });

        const [stock] = await Stock.findOrCreate({
          where: {
            warehouseId: warehouse.warehouseId,
            typeComponentId: componentRecord.typeComponentId,
          },
          defaults: {
            warehouseId: warehouse.warehouseId,
            typeComponentId: componentRecord.typeComponentId,
            quantityInStock: quantityInWarehouse,
            quantityReserved: 0,
          },
          transaction,
        });

        await stock.update(
          {
            quantityInStock: quantityInWarehouse,
          },
          { transaction }
        );

        createdComponentsInWarehouses += item.quantity;
      }
    }

    let installedComponents = 0;

    for (const vehicle of vehicles) {
      const modelKey = VEHICLE_DATA.find(
        (item) => item.vin === vehicle.vin
      ).modelKey;
      const warrantyItems = WARRANTY_COMPONENT_PLAN[modelKey];

      for (const item of warrantyItems) {
        const componentRecord = typeComponents[item.sku];
        for (let i = 1; i <= item.quantity; i += 1) {
          const serialNumber = `${item.sku}-INST-${vehicle.vin}-${String(
            i
          ).padStart(2, "0")}`;
          await Component.findOrCreate({
            where: { serialNumber },
            defaults: {
              typeComponentId: componentRecord.typeComponentId,
              serialNumber,
              status: "INSTALLED",
              vehicleVin: vehicle.vin,
              installedAt: vehicle.purchaseDate,
              warehouseId: null,
            },
            transaction,
          });
          installedComponents += 1;
        }
      }
    }

    await transaction.commit();

    console.log("✅ Seed thành công.");
    console.log(`   • Components trong kho: ${createdComponentsInWarehouses}`);
    console.log(`   • Components đã lắp trên xe: ${installedComponents}`);
    console.log(
      "   • Mỗi Stock.quantityInStock đã khớp với số component IN_WAREHOUSE tương ứng."
    );
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Seed thất bại:", error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🌟 Hoàn tất seed.");
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { seedDatabase };
