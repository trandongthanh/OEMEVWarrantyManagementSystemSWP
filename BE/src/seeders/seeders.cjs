const { sequelize } = require("../models/index.cjs");
const bcrypt = require("bcrypt");

async function seedDatabase() {
  try {
    console.log("🌱 Bắt đầu tạo dữ liệu mẫu thực tế...\n");

    // Tạo VehicleCompany
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

    // Tạo ComponentCompany
    const [catl] = await sequelize.models.ComponentCompany.findOrCreate({
      where: { name: "CATL Battery" },
      defaults: {
        name: "CATL Battery",
        address: "China",
        phone: "+86-593-8988888",
        email: "info@catl.com",
      },
    });
    console.log("✅ ComponentCompany: CATL");

    // Tạo VehicleModel
    const [vfe34] = await sequelize.models.VehicleModel.findOrCreate({
      where: { vehicleModelName: "VF e34" },
      defaults: {
        vehicleModelName: "VF e34",
        yearOfLaunch: new Date("2022-01-01"),
        generalWarrantyDuration: 60,
        generalWarrantyMileage: 120000,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    console.log("✅ VehicleModel: VF e34");

    // Tạo ServiceCenter
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

    // Tạo Warehouse
    const warehouses = [];
    const [whCentral] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Trung Tâm" },
      defaults: {
        name: "Kho Trung Tâm",
        address: "Hòa Lạc",
        priority: 1,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });
    warehouses.push(whCentral);

    const [whHN1] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Chính HN" },
      defaults: {
        name: "Kho Chính HN",
        address: "Long Biên",
        priority: 2,
        serviceCenterId: scHN.serviceCenterId,
      },
    });
    warehouses.push(whHN1);

    const [whHN2] = await sequelize.models.Warehouse.findOrCreate({
      where: { name: "Kho Phụ HN" },
      defaults: {
        name: "Kho Phụ HN",
        address: "Long Biên - T2",
        priority: 3,
        serviceCenterId: scHN.serviceCenterId,
      },
    });
    warehouses.push(whHN2);
    console.log("✅ Warehouse: 3 kho");

    // Tạo TypeComponent
    const typeComponents = [];
    const [battery] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BAT-HV-72KWH" },
      defaults: {
        name: "Pin Cao Áp 72kWh",
        price: 350000000,
        sku: "BAT-HV-72KWH",
        category: "HIGH_VOLTAGE_BATTERY",
      },
    });
    typeComponents.push(battery);

    const [bms] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "BMS-CTRL-01" },
      defaults: {
        name: "Bộ Quản Lý Pin BMS",
        price: 45000000,
        sku: "BMS-CTRL-01",
        category: "HIGH_VOLTAGE_BATTERY",
      },
    });
    typeComponents.push(bms);

    const [motor] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "MOT-ELC-150KW" },
      defaults: {
        name: "Động Cơ Điện 150kW",
        price: 180000000,
        sku: "MOT-ELC-150KW",
        category: "POWERTRAIN",
      },
    });
    typeComponents.push(motor);

    const [display] = await sequelize.models.TypeComponent.findOrCreate({
      where: { sku: "DISP-LCD-12IN" },
      defaults: {
        name: "Màn Hình LCD 12 inch",
        price: 18000000,
        sku: "DISP-LCD-12IN",
        category: "INFOTAINMENT_ADAS",
      },
    });
    typeComponents.push(display);
    console.log("✅ TypeComponent: 4 loại");

    // Tạo TypeComponentByCompany
    await sequelize.models.TypeComponentByCompany.findOrCreate({
      where: {
        componentCompanyId: catl.componentCompanyId,
        typeComponentId: battery.typeComponentId,
      },
      defaults: {
        componentCompanyId: catl.componentCompanyId,
        typeComponentId: battery.typeComponentId,
      },
    });
    await sequelize.models.TypeComponentByCompany.findOrCreate({
      where: {
        componentCompanyId: catl.componentCompanyId,
        typeComponentId: bms.typeComponentId,
      },
      defaults: {
        componentCompanyId: catl.componentCompanyId,
        typeComponentId: bms.typeComponentId,
      },
    });
    console.log("✅ TypeComponentByCompany: liên kết");

    // Tạo WarrantyComponent
    await sequelize.models.WarrantyComponent.findOrCreate({
      where: {
        vehicleModelId: vfe34.vehicleModelId,
        typeComponentId: battery.typeComponentId,
      },
      defaults: {
        vehicleModelId: vfe34.vehicleModelId,
        typeComponentId: battery.typeComponentId,
        quantity: 1,
        durationMonth: 96,
        mileageLimit: 160000,
      },
    });
    await sequelize.models.WarrantyComponent.findOrCreate({
      where: {
        vehicleModelId: vfe34.vehicleModelId,
        typeComponentId: bms.typeComponentId,
      },
      defaults: {
        vehicleModelId: vfe34.vehicleModelId,
        typeComponentId: bms.typeComponentId,
        quantity: 1,
        durationMonth: 60,
        mileageLimit: 120000,
      },
    });
    console.log("✅ WarrantyComponent: chính sách bảo hành");

    // Tạo Roles - Đầy đủ 7 vai trò
    const roles = {};

    const [staffRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "service_center_staff" },
    });
    roles.staff = staffRole;

    const [techRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "service_center_technician" },
    });
    roles.tech = techRole;

    const [managerRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "service_center_manager" },
    });
    roles.manager = managerRole;

    const [emvStaffRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "emv_staff" },
    });
    roles.emvStaff = emvStaffRole;

    const [partsCoordSCRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "parts_coordinator_service_center" },
    });
    roles.partsCoordSC = partsCoordSCRole;

    const [partsCoordCompanyRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "parts_coordinator_company" },
    });
    roles.partsCoordCompany = partsCoordCompanyRole;

    const [emvAdminRole] = await sequelize.models.Role.findOrCreate({
      where: { roleName: "emv_admin" },
    });
    roles.emvAdmin = emvAdminRole;

    console.log("✅ Role: 7 vai trò đầy đủ");

    // Tạo Users - 7 người dùng cho 7 vai trò
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 1. Service Center Staff - Nhân viên tiếp nhận
    const [staffHN] = await sequelize.models.User.findOrCreate({
      where: { username: "staff_hn1" },
      defaults: {
        username: "staff_hn1",
        password: hashedPassword,
        email: "staff.hn1@vinfast.vn",
        phone: "0901234567",
        address: "Hà Nội",
        name: "Nguyễn Văn An",
        roleId: roles.staff.roleId,
        serviceCenterId: scHN.serviceCenterId,
      },
    });

    // 2. Service Center Technician - Kỹ thuật viên
    const [techHN1] = await sequelize.models.User.findOrCreate({
      where: { username: "tech_hn1" },
      defaults: {
        username: "tech_hn1",
        password: hashedPassword,
        email: "tech.hn1@vinfast.vn",
        phone: "0901234568",
        address: "Hà Nội",
        name: "Lê Văn Cường",
        roleId: roles.tech.roleId,
        serviceCenterId: scHN.serviceCenterId,
      },
    });

    // 3. Service Center Manager - Quản lý trung tâm
    const [managerHN] = await sequelize.models.User.findOrCreate({
      where: { username: "manager_hn1" },
      defaults: {
        username: "manager_hn1",
        password: hashedPassword,
        email: "manager.hn1@vinfast.vn",
        phone: "0901234569",
        address: "Hà Nội",
        name: "Trần Thị Bình",
        roleId: roles.manager.roleId,
        serviceCenterId: scHN.serviceCenterId,
      },
    });

    // 4. EMV Staff - Nhân viên công ty xe
    const [emvStaff] = await sequelize.models.User.findOrCreate({
      where: { username: "emv_staff1" },
      defaults: {
        username: "emv_staff1",
        password: hashedPassword,
        email: "emv.staff1@vinfast.vn",
        phone: "0901234570",
        address: "Hà Nội",
        name: "Phạm Văn Dũng",
        roleId: roles.emvStaff.roleId,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });

    // 5. Parts Coordinator Service Center - Điều phối phụ tùng SC
    const [partsCoordSC] = await sequelize.models.User.findOrCreate({
      where: { username: "parts_sc_hn1" },
      defaults: {
        username: "parts_sc_hn1",
        password: hashedPassword,
        email: "parts.sc.hn1@vinfast.vn",
        phone: "0901234571",
        address: "Hà Nội",
        name: "Hoàng Thị Em",
        roleId: roles.partsCoordSC.roleId,
        serviceCenterId: scHN.serviceCenterId,
      },
    });

    // 6. Parts Coordinator Company - Điều phối phụ tùng công ty
    const [partsCoordCompany] = await sequelize.models.User.findOrCreate({
      where: { username: "parts_company1" },
      defaults: {
        username: "parts_company1",
        password: hashedPassword,
        email: "parts.company1@vinfast.vn",
        phone: "0901234572",
        address: "Hà Nội",
        name: "Đặng Văn Phúc",
        roleId: roles.partsCoordCompany.roleId,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });

    // 7. EMV Admin - Quản trị hệ thống
    const [emvAdmin] = await sequelize.models.User.findOrCreate({
      where: { username: "admin" },
      defaults: {
        username: "admin",
        password: hashedPassword,
        email: "admin@vinfast.vn",
        phone: "0901234573",
        address: "Hà Nội",
        name: "Võ Thị Giang (Admin)",
        roleId: roles.emvAdmin.roleId,
        vehicleCompanyId: vehicleCompany.vehicleCompanyId,
      },
    });

    console.log("✅ User: 7 người dùng (đầy đủ 7 vai trò)");

    // Tạo WorkSchedule
    for (let i = 0; i < 30; i++) {
      const workDate = new Date(2025, 9, 27 + i);
      await sequelize.models.WorkSchedule.findOrCreate({
        where: {
          technicianId: techHN1.userId,
          workDate: workDate,
        },
        defaults: {
          technicianId: techHN1.userId,
          workDate: workDate,
          status: i % 7 === 0 ? "UNAVAILABLE" : "AVAILABLE",
          notes: i % 7 === 0 ? "Ngày nghỉ" : null,
        },
      });
    }
    console.log("✅ WorkSchedule: 30 ngày");

    console.log("✅ User: 7 người");

    // Tạo Customers (5 khách hàng)
    const customers = [];
    const customerData = [
      { name: "Nguyễn Văn An", phone: "0901234567", email: "nguyenvanan@gmail.com", address: "123 Đường ABC, Hà Nội" },
      { name: "Trần Thị Bình", phone: "0912345678", email: "tranthibinh@gmail.com", address: "456 Đường DEF, TP.HCM" },
      { name: "Lê Hoàng Cường", phone: "0923456789", email: "lehoangcuong@gmail.com", address: "789 Đường GHI, Đà Nẵng" },
      { name: "Phạm Minh Đức", phone: "0934567890", email: "phamminhduc@gmail.com", address: "321 Đường JKL, Hải Phòng" },
      { name: "Hoàng Thu Hà", phone: "0945678901", email: "hoangthuha@gmail.com", address: "654 Đường MNO, Cần Thơ" },
    ];

    for (const custData of customerData) {
      const [cust] = await sequelize.models.Customer.findOrCreate({
        where: { phone: custData.phone },
        defaults: custData,
      });
      customers.push(cust);
    }
    console.log(`✅ Customer: ${customers.length} khách hàng`);

    // Tạo Vehicles (10 xe cho 5 khách hàng - mỗi người 2 xe)
    const vehicles = [];
    const vehicleData = [
      // Customer 1 - Nguyễn Văn An
      { vin: "VF34ABC123456789A", plate: "30A-12345", purchaseDate: "2023-06-01", owner: customers[0] },
      { vin: "VF34ABC123456789B", plate: "30A-12346", purchaseDate: "2023-08-15", owner: customers[0] },
      
      // Customer 2 - Trần Thị Bình  
      { vin: "VF34DEF234567890A", plate: "51F-23456", purchaseDate: "2023-07-10", owner: customers[1] },
      { vin: "VF34DEF234567890B", plate: "51F-23457", purchaseDate: "2023-09-20", owner: customers[1] },
      
      // Customer 3 - Lê Hoàng Cường
      { vin: "VF34GHI345678901A", plate: "43A-34567", purchaseDate: "2023-05-15", owner: customers[2] },
      { vin: "VF34GHI345678901B", plate: "43A-34568", purchaseDate: "2023-10-01", owner: customers[2] },
      
      // Customer 4 - Phạm Minh Đức
      { vin: "VF34JKL456789012A", plate: "16B-45678", purchaseDate: "2023-06-20", owner: customers[3] },
      { vin: "VF34JKL456789012B", plate: "16B-45679", purchaseDate: "2023-11-10", owner: customers[3] },
      
      // Customer 5 - Hoàng Thu Hà
      { vin: "VF34MNO567890123A", plate: "65C-56789", purchaseDate: "2023-04-05", owner: customers[4] },
      { vin: "VF34MNO567890123B", plate: "65C-56790", purchaseDate: "2023-12-01", owner: customers[4] },
    ];

    for (const vehData of vehicleData) {
      const [veh] = await sequelize.models.Vehicle.findOrCreate({
        where: { vin: vehData.vin },
        defaults: {
          vin: vehData.vin,
          vehicleModelId: vfe34.vehicleModelId,
          licensePlate: vehData.plate,
          ownerId: vehData.owner.id,
          purchaseDate: new Date(vehData.purchaseDate),
        },
      });
      vehicles.push(veh);
    }
    console.log(`✅ Vehicle: ${vehicles.length} xe`);    // Tạo Stock và Components
    console.log("\n📦 Tạo Components và Stocks...");
    const stockConfigs = [
      // Kho Trung Tâm (OEM) - Số lượng lớn
      { warehouse: whCentral, typeComp: battery, qty: 50 },
      { warehouse: whCentral, typeComp: bms, qty: 60 },
      { warehouse: whCentral, typeComp: motor, qty: 30 },
      { warehouse: whCentral, typeComp: display, qty: 40 },
      
      // Kho Chính HN - Số lượng trung bình
      { warehouse: whHN1, typeComp: battery, qty: 20 },
      { warehouse: whHN1, typeComp: bms, qty: 25 },
      { warehouse: whHN1, typeComp: motor, qty: 10 },
      { warehouse: whHN1, typeComp: display, qty: 15 },
      
      // Kho Phụ HN - Số lượng nhỏ
      { warehouse: whHN2, typeComp: battery, qty: 10 },
      { warehouse: whHN2, typeComp: bms, qty: 12 },
      { warehouse: whHN2, typeComp: display, qty: 20 },
    ];

    let totalComps = 0;
    for (const config of stockConfigs) {
      // Tạo Stock
      await sequelize.models.Stock.findOrCreate({
        where: {
          warehouseId: config.warehouse.warehouseId,
          typeComponentId: config.typeComp.typeComponentId,
        },
        defaults: {
          warehouseId: config.warehouse.warehouseId,
          typeComponentId: config.typeComp.typeComponentId,
          quantityInStock: config.qty,
          quantityReserved: 0,
        },
      });

      // Tạo Components
      for (let i = 0; i < config.qty; i++) {
        const serial = `${
          config.typeComp.sku
        }-${config.warehouse.name.substring(0, 3)}-${String(
          totalComps + i + 1
        ).padStart(4, "0")}`;
        await sequelize.models.Component.findOrCreate({
          where: { serialNumber: serial },
          defaults: {
            typeComponentId: config.typeComp.typeComponentId,
            serialNumber: serial,
            warehouseId: config.warehouse.warehouseId,
            status: "IN_WAREHOUSE",
          },
        });
      }
      totalComps += config.qty;
      console.log(
        `  ✓ ${config.warehouse.name} - ${config.typeComp.name}: ${config.qty} components`
      );
    }

    // Tạo components đã lắp vào các xe (mỗi xe có 1 BMS installed)
    console.log("\n🔩 Tạo Components đã lắp vào xe...");
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      const [installedBMS] = await sequelize.models.Component.findOrCreate({
        where: { serialNumber: `BMS-INSTALLED-${vehicle.vin}` },
        defaults: {
          typeComponentId: bms.typeComponentId,
          serialNumber: `BMS-INSTALLED-${vehicle.vin}`,
          status: "INSTALLED",
          vehicleVin: vehicle.vin,
          installedAt: new Date(vehicle.purchaseDate),
        },
      });
      console.log(`  ✓ BMS lắp vào xe ${vehicle.licensePlate} (VIN: ${vehicle.vin})`);
    }

    console.log(`\n✅ Tổng: ${totalComps} components trong kho + ${vehicles.length} đã lắp`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 HOÀN THÀNH! DỮ LIỆU ĐÃ ĐƯỢC TẠO THÀNH CÔNG!");
    console.log("=".repeat(60));
    console.log("\n📊 TÓM TẮT:");
    console.log("   🏢 1 Công ty xe: VinFast Auto");
    console.log("   🏭 1 Nhà cung cấp: CATL Battery");
    console.log("   🚗 1 Dòng xe: VF e34");
    console.log("   🏥 2 Trung tâm dịch vụ");
    console.log("   📦 3 Kho (1 trung tâm + 2 chi nhánh)");
    console.log("   🔧 4 Loại linh kiện");
    console.log(`   ⚙️  ${totalComps + vehicles.length} Components (${totalComps} trong kho + ${vehicles.length} đã lắp)`);
    console.log("   � 7 Người dùng (đầy đủ 7 vai trò)");
    console.log("   � 5 Khách hàng");
    console.log("   🚙 10 Xe (mỗi khách 2 xe)");
    console.log("   📅 30 Lịch làm việc");

    console.log("\n🔑 TÀI KHOẢN TEST (password: 123456):");
    console.log("   👔 Staff:           staff_hn1");
    console.log("   🔧 Technician:      tech_hn1");
    console.log("   👨‍💼 Manager:         manager_hn1");
    console.log("   🏢 EMV Staff:       emv_staff1");
    console.log("   📦 Parts SC:        parts_sc_hn1");
    console.log("   🏭 Parts Company:   parts_company1");
    console.log("   👑 EMV Admin:       emv_admin1");

    console.log("\n💡 STOCK DETAILS:");
    console.log("   📦 Kho Trung Tâm: 50 Battery, 60 BMS, 30 Motor, 40 Display");
    console.log("   📦 Kho Chính HN:   20 Battery, 25 BMS, 10 Motor, 15 Display");
    console.log("   📦 Kho Phụ HN:     10 Battery, 12 BMS, 20 Display");
    console.log(`   📊 TỔNG TRONG KHO: ${totalComps} components`);

    console.log("\n💡 LƯU Ý:");
    console.log("   ✓ Stock.quantityInStock = số lượng Component IN_WAREHOUSE");
    console.log("   ✓ Mỗi xe đã có 1 BMS được INSTALLED");
    console.log("   ✓ Dữ liệu đủ lớn để test stock transfer & allocation");
    console.log("   ✓ 10 xe với VIN & biển số khác nhau");
    console.log("=".repeat(60) + "\n");
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
