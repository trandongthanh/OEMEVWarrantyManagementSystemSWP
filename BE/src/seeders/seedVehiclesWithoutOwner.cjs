const { sequelize } = require("../models/index.cjs");

/**
 * SEEDER: TẠO XE KHÔNG CÓ CHỦ (Vehicles Without Owner)
 * 
 * Mục đích: Tạo xe đã sản xuất xong, đã lắp đủ components theo chuẩn WarrantyComponent
 * của model, nhưng chưa bán cho khách hàng (ownerId = null, purchaseDate = null)
 * 
 * Trường hợp thực tế:
 * - Xe trong showroom chờ bán
 * - Xe mới từ nhà máy về đại lý
 * - Xe demo/test drive
 * 
 * Quy tắc:
 * 1. ownerId = null (chưa có chủ)
 * 2. purchaseDate = null (chưa bán)
 * 3. dateOfManufacture = có (đã sản xuất)
 * 4. Components: status = "INSTALLED" (đã lắp, dù xe chưa bán)
 * 5. Tuân thủ 100% WarrantyComponent của model
 */

async function seedVehiclesWithoutOwner() {
  try {
    console.log("🚗 Bắt đầu tạo xe KHÔNG CÓ CHỦ với components đã lắp đặt...\n");

    // ========================================
    // 1. LẤY DỮ LIỆU CƠ BẢN
    // ========================================
    const vehicleCompany = await sequelize.models.VehicleCompany.findOne({
      where: { name: "VinFast Auto" },
    });

    if (!vehicleCompany) {
      throw new Error("❌ Không tìm thấy VehicleCompany. Chạy seeder chính trước!");
    }

    // Lấy tất cả vehicle models
    const vehicleModels = await sequelize.models.VehicleModel.findAll({
      where: { vehicleCompanyId: vehicleCompany.vehicleCompanyId },
    });

    if (vehicleModels.length === 0) {
      throw new Error("❌ Không tìm thấy VehicleModel nào!");
    }

    console.log(`✅ Tìm thấy ${vehicleModels.length} dòng xe\n`);

    // Map models by name để dễ truy cập
    const modelsMap = {};
    for (const model of vehicleModels) {
      modelsMap[model.vehicleModelName] = model;
    }

    // ========================================
    // 2. LẤY WARRANTY COMPONENT CHO TỪNG MODEL
    // ========================================
    console.log("📋 Load WarrantyComponent cho từng model...");
    
    const warrantyComponentsByModel = {};
    
    for (const model of vehicleModels) {
      const warrantyComps = await sequelize.models.WarrantyComponent.findAll({
        where: { vehicleModelId: model.vehicleModelId },
        include: [
          {
            model: sequelize.models.TypeComponent,
            as: "typeComponent",
            attributes: ["typeComponentId", "name", "sku", "category"],
          },
        ],
      });
      
      warrantyComponentsByModel[model.vehicleModelName] = warrantyComps;
      console.log(`  ✓ ${model.vehicleModelName}: ${warrantyComps.length} components`);
    }

    console.log("");

    // ========================================
    // 3. ĐỊNH NGHĨA XE KHÔNG CÓ CHỦ
    // ========================================
    // Tạo xe theo tỷ lệ thực tế: phổ biến hơn → nhiều xe hơn
    const vehiclesWithoutOwnerData = [
      // === VF e34 (Phổ biến, giá rẻ) - 8 xe ===
      {
        model: "VF e34",
        vin: "VFE34STK2025000001",
        plate: null, // Chưa đăng ký biển
        mfgDate: "2025-10-15",
        location: "Showroom Hà Nội",
        color: "Trắng Ngọc Trai",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000002",
        plate: null,
        mfgDate: "2025-10-18",
        location: "Showroom TP.HCM",
        color: "Đỏ Ruby",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000003",
        plate: null,
        mfgDate: "2025-10-20",
        location: "Kho Hải Phòng",
        color: "Xanh Navy",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000004",
        plate: null,
        mfgDate: "2025-10-22",
        location: "Showroom Hà Nội",
        color: "Đen Tuyền",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000005",
        plate: null,
        mfgDate: "2025-10-23",
        location: "Showroom TP.HCM",
        color: "Bạc Titan",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000006",
        plate: null,
        mfgDate: "2025-10-24",
        location: "Showroom Đà Nẵng",
        color: "Trắng Ngọc Trai",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000007",
        plate: null,
        mfgDate: "2025-10-25",
        location: "Test Drive - Hà Nội",
        color: "Xám Titan",
      },
      {
        model: "VF e34",
        vin: "VFE34STK2025000008",
        plate: "TEST-001", // Xe test drive có biển tạm
        mfgDate: "2025-09-01",
        location: "Test Drive - TP.HCM",
        color: "Đỏ Ruby",
      },

      // === VF 5 Plus (Phổ biến, phân khúc A) - 6 xe ===
      {
        model: "VF 5 Plus",
        vin: "VF5PSSTK2025000001",
        plate: null,
        mfgDate: "2025-10-10",
        location: "Showroom Hà Nội",
        color: "Xanh Dương",
      },
      {
        model: "VF 5 Plus",
        vin: "VF5PSSTK2025000002",
        plate: null,
        mfgDate: "2025-10-12",
        location: "Showroom TP.HCM",
        color: "Vàng Chanh",
      },
      {
        model: "VF 5 Plus",
        vin: "VF5PSSTK2025000003",
        plate: null,
        mfgDate: "2025-10-16",
        location: "Kho Hải Phòng",
        color: "Trắng Ngọc Trai",
      },
      {
        model: "VF 5 Plus",
        vin: "VF5PSSTK2025000004",
        plate: null,
        mfgDate: "2025-10-19",
        location: "Showroom Cần Thơ",
        color: "Đỏ Cherry",
      },
      {
        model: "VF 5 Plus",
        vin: "VF5PSSTK2025000005",
        plate: null,
        mfgDate: "2025-10-21",
        location: "Showroom Hà Nội",
        color: "Xám Bạc",
      },
      {
        model: "VF 5 Plus",
        vin: "VF5PSSTK2025000006",
        plate: "TEST-002",
        mfgDate: "2025-09-15",
        location: "Test Drive - Đà Nẵng",
        color: "Xanh Dương",
      },

      // === VF 8 (Cao cấp hơn) - 5 xe ===
      {
        model: "VF 8",
        vin: "VF8XSSTK2025000001",
        plate: null,
        mfgDate: "2025-10-05",
        location: "Showroom Hà Nội Premium",
        color: "Đen Huyền Bí",
      },
      {
        model: "VF 8",
        vin: "VF8XSSTK2025000002",
        plate: null,
        mfgDate: "2025-10-08",
        location: "Showroom TP.HCM Premium",
        color: "Trắng Ngọc Trai",
      },
      {
        model: "VF 8",
        vin: "VF8XSSTK2025000003",
        plate: null,
        mfgDate: "2025-10-14",
        location: "Kho Hải Phòng",
        color: "Xanh Navy",
      },
      {
        model: "VF 8",
        vin: "VF8XSSTK2025000004",
        plate: null,
        mfgDate: "2025-10-17",
        location: "Showroom Hà Nội Premium",
        color: "Bạc Titan",
      },
      {
        model: "VF 8",
        vin: "VF8XSSTK2025000005",
        plate: "TEST-003",
        mfgDate: "2025-08-20",
        location: "Test Drive - TP.HCM",
        color: "Đỏ Rượu Vang",
      },

      // === VF 9 (Cao cấp nhất, ít hơn) - 3 xe ===
      {
        model: "VF 9",
        vin: "VF9XXSTK2025000001",
        plate: null,
        mfgDate: "2025-10-01",
        location: "Showroom Hà Nội Flagship",
        color: "Đen Obsidian",
      },
      {
        model: "VF 9",
        vin: "VF9XXSTK2025000002",
        plate: null,
        mfgDate: "2025-10-11",
        location: "Showroom TP.HCM Flagship",
        color: "Trắng Ngọc Trai",
      },
      {
        model: "VF 9",
        vin: "VF9XXSTK2025000003",
        plate: "TEST-004",
        mfgDate: "2025-08-10",
        location: "Test Drive - Hà Nội",
        color: "Xanh Petrol",
      },
    ];

    console.log(
      `🚙 Chuẩn bị tạo ${vehiclesWithoutOwnerData.length} xe không có chủ:\n`
    );
    console.log(`   - VF e34: 8 xe (phổ biến nhất)`);
    console.log(`   - VF 5 Plus: 6 xe (phân khúc A)`);
    console.log(`   - VF 8: 5 xe (cao cấp)`);
    console.log(`   - VF 9: 3 xe (flagship)\n`);

    // ========================================
    // 4. TẠO VEHICLES VÀ COMPONENTS
    // ========================================
    const createdVehicles = [];
    let totalInstalledComponents = 0;

    for (const vehData of vehiclesWithoutOwnerData) {
      const model = modelsMap[vehData.model];
      
      if (!model) {
        console.warn(`⚠️  Không tìm thấy model ${vehData.model}, bỏ qua...`);
        continue;
      }

      // Tạo vehicle
      const [vehicle, created] = await sequelize.models.Vehicle.findOrCreate({
        where: { vin: vehData.vin },
        defaults: {
          vin: vehData.vin,
          vehicleModelId: model.vehicleModelId,
          licensePlate: vehData.plate, // null hoặc biển test
          ownerId: null, // ← KHÔNG CÓ CHỦ
          purchaseDate: null, // ← CHƯA BÁN
          dateOfManufacture: new Date(vehData.mfgDate),
          placeOfManufacture: "Nhà máy Hải Phòng, Việt Nam",
        },
      });

      if (!created) {
        console.log(`  ⏭️  VIN ${vehData.vin} đã tồn tại, bỏ qua`);
        continue;
      }

      createdVehicles.push(vehicle);

      // Lấy danh sách components theo WarrantyComponent
      const warrantyComps = warrantyComponentsByModel[vehData.model];
      let vehicleCompCount = 0;

      // Tạo components đã lắp đặt trên xe
      for (const wc of warrantyComps) {
        const typeComp = wc.typeComponent;
        const quantity = wc.quantity || 1;

        for (let i = 1; i <= quantity; i++) {
          const serial = `${typeComp.sku}-STOCK-${vehData.vin}-${String(i).padStart(2, "0")}`;
          
          await sequelize.models.Component.findOrCreate({
            where: { serialNumber: serial },
            defaults: {
              typeComponentId: typeComp.typeComponentId,
              serialNumber: serial,
              status: "INSTALLED", // Đã lắp đặt vào xe
              vehicleVin: vehicle.vin,
              installedAt: new Date(vehData.mfgDate), // Lắp từ khi sản xuất
              warehouseId: null,
            },
          });

          vehicleCompCount++;
          totalInstalledComponents++;
        }
      }

      console.log(
        `  ✅ ${vehData.model} - VIN: ${vehData.vin.slice(-6)} | ${vehicleCompCount} components | ${vehData.location}`
      );
    }

    // ========================================
    // 5. TÓM TẮT
    // ========================================
    // ========================================
    // 5. CẬP NHẬT STOCK - ĐẢM BẢO SỐ LƯỢNG KHỚP VỚI THỰC TẾ
    // ========================================
    console.log("\n📦 Kiểm tra và cập nhật Stock...");

    // Đếm số lượng components IN_WAREHOUSE cho mỗi warehouse + typeComponent
    const stockCounts = {};
    
    const allComponentsInWarehouse = await sequelize.models.Component.findAll({
      where: { status: "IN_WAREHOUSE" },
      attributes: ["warehouseId", "typeComponentId"],
    });

    for (const comp of allComponentsInWarehouse) {
      const key = `${comp.warehouseId}_${comp.typeComponentId}`;
      stockCounts[key] = (stockCounts[key] || 0) + 1;
    }

    // Cập nhật hoặc tạo Stock entries
    let stockUpdated = 0;
    let stockCreated = 0;

    for (const [key, count] of Object.entries(stockCounts)) {
      const [warehouseId, typeComponentId] = key.split("_");

      const [stock, created] = await sequelize.models.Stock.findOrCreate({
        where: {
          warehouseId: warehouseId,
          typeComponentId: typeComponentId,
        },
        defaults: {
          warehouseId: warehouseId,
          typeComponentId: typeComponentId,
          quantityInStock: count,
          quantityReserved: 0,
        },
      });

      if (!created) {
        // Cập nhật số lượng nếu đã tồn tại
        await stock.update({ quantityInStock: count });
        stockUpdated++;
      } else {
        stockCreated++;
      }
    }

    console.log(`   ✓ Đã tạo ${stockCreated} Stock entries mới`);
    console.log(`   ✓ Đã cập nhật ${stockUpdated} Stock entries`);
    console.log(`   ✓ Tổng: ${Object.keys(stockCounts).length} Stock entries được đồng bộ`);

    // ========================================
    // 6. TÓM TẮT
    // ========================================
    console.log("\n" + "=".repeat(80));
    console.log("🎉 HOÀN THÀNH TẠO XE KHÔNG CÓ CHỦ!");
    console.log("=".repeat(80));
    console.log("\n📊 TÓM TẮT:");
    console.log(`   🚗 Tổng số xe tạo mới: ${createdVehicles.length}`);
    console.log(`   ⚙️  Tổng components lắp đặt: ${totalInstalledComponents}`);
    console.log(
      `   📍 Trung bình: ${Math.round(totalInstalledComponents / createdVehicles.length)} components/xe`
    );

    console.log("\n📋 PHÂN LOẠI:");
    const modelCounts = {};
    for (const v of createdVehicles) {
      const modelName = vehicleModels.find(
        (m) => m.vehicleModelId === v.vehicleModelId
      )?.vehicleModelName;
      modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
    }
    for (const [modelName, count] of Object.entries(modelCounts)) {
      console.log(`   - ${modelName}: ${count} xe`);
    }

    console.log("\n💡 ĐẶC ĐIỂM:");
    console.log("   ✓ ownerId = NULL (chưa có chủ)");
    console.log("   ✓ purchaseDate = NULL (chưa bán)");
    console.log("   ✓ dateOfManufacture = có giá trị (đã sản xuất)");
    console.log("   ✓ Components: status = 'INSTALLED'");
    console.log("   ✓ Components lắp đặt 100% theo WarrantyComponent của model");
    console.log("   ✓ Xe phân bố ở showroom, kho, và test drive");
    console.log("   ✓ Stock.quantityInStock = SỐ THỰC TẾ components IN_WAREHOUSE");

    console.log("\n🎯 SỬ DỤNG:");
    console.log("   → Xe trong showroom để khách hàng xem");
    console.log("   → Xe demo/test drive");
    console.log("   → Xe đã về kho chờ bán");
    console.log("   → Cập nhật ownerId + purchaseDate khi có người mua");

    console.log("\n" + "=".repeat(80) + "\n");

    return {
      vehiclesCreated: createdVehicles.length,
      componentsInstalled: totalInstalledComponents,
      modelBreakdown: modelCounts,
      stockSynced: Object.keys(stockCounts).length,
    };
  } catch (error) {
    console.error("\n❌ LỖI:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

// Chạy trực tiếp nếu gọi file này
if (require.main === module) {
  seedVehiclesWithoutOwner()
    .then((result) => {
      console.log("✨ Seeding xe không có chủ hoàn tất!");
      console.log(`✅ Đã tạo ${result.vehiclesCreated} xe với ${result.componentsInstalled} components`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding thất bại:", error.message);
      process.exit(1);
    });
}

module.exports = { seedVehiclesWithoutOwner };
