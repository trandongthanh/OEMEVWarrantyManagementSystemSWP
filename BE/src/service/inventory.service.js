import * as XLSX from "xlsx";
import { BadRequestError, NotFoundError } from "../error/index.js";
import db from "../models/index.cjs";

class InventoryService {
  #inventoryRepository;
  #inventoryAdjustmentRepository;
  #warehouseRepository;
  #userRepository;
  #notificationService;
  #typeComponentRepository;
  #componentRepository;

  constructor({
    inventoryRepository,
    inventoryAdjustmentRepository,
    warehouseRepository,
    userRepository,
    notificationService,
    typeComponentRepository,
    componentRepository,
  }) {
    this.#inventoryRepository = inventoryRepository;
    this.#inventoryAdjustmentRepository = inventoryAdjustmentRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#userRepository = userRepository;
    this.#notificationService = notificationService;
    this.#typeComponentRepository = typeComponentRepository;
    this.#componentRepository = componentRepository;
  }
  getInventorySummary = async ({
    serviceCenterId,
    roleName,
    companyId,
    filters = {},
  }) => {
    const warehouseWhere = {};

    if (roleName === "parts_coordinator_service_center") {
      if (!serviceCenterId) {
        throw new Error("Service center context is required for this role");
      }
      warehouseWhere.serviceCenterId = serviceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      if (!companyId) {
        throw new Error("Company context is required for this role");
      }

      warehouseWhere.vehicleCompanyId = companyId;

      if (filters?.serviceCenterId) {
        warehouseWhere.serviceCenterId = filters.serviceCenterId;
      }
    } else if (serviceCenterId) {
      warehouseWhere.serviceCenterId = serviceCenterId;
    }

    const summary = await this.#inventoryRepository.getInventorySummary({
      warehouseWhereClause: warehouseWhere,
    });

    return summary;
  };

  getInventoryTypeComponents = async ({
    serviceCenterId,
    roleName,
    companyId,
    filters = {},
  }) => {
    const {
      page,
      limit,
      typeComponentId,
      serviceCenterId: filterServiceCenterId,
    } = filters;

    const warehouseWhere = {};

    if (roleName === "parts_coordinator_service_center") {
      if (!serviceCenterId) {
        throw new Error("Service center context is required for this role");
      }

      warehouseWhere.serviceCenterId = filterServiceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      if (!companyId) {
        throw new Error("Company context is required for this role");
      }

      warehouseWhere.vehicleCompanyId = companyId;

      if (filters?.serviceCenterId) {
        warehouseWhere.filterServiceCenterId = filters.filterServiceCenterId;
      }
    } else if (serviceCenterId) {
      warehouseWhere.filterServiceCenterId = filterServiceCenterId;
    }

    const limitParse = Number.parseInt(limit, 10) || 10;

    const pageParse = Number.parseInt(page, 10) || 1;

    const offset = (pageParse - 1) * limitParse;

    const { rows, count } =
      await this.#inventoryRepository.getInventoryTypeComponents({
        warehouseWhereClause: warehouseWhere,
        typeComponentId,
        limit: limitParse,
        offset,
      });

    const pages = Math.ceil(count / limitParse);

    const components = {
      typeComponents: rows,
      pagination: {
        total: count,
        pages: pageParse,
        limit: limitParse,
        totalPages: pages,
      },
    };

    return components;
  };

  getComponentUploadTemplate = async () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { sku: "LCD-12-VF34", serialNumber: "SN123456789" },
      { sku: "BAT-HV-90KWH", serialNumber: "SN987654321" },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Components");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return buffer;
  };

  #parseAndValidateExcelFile = (fileBuffer) => {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestError("The Excel file contains no sheets.");
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      throw new BadRequestError("The Excel file has no data rows.");
    }

    const firstRow = jsonData[0];
    if (
      !firstRow.hasOwnProperty("sku") ||
      !firstRow.hasOwnProperty("serialNumber")
    ) {
      throw new BadRequestError(
        "Excel file must contain 'sku' and 'serialNumber' columns."
      );
    }

    const componentsToCreate = [];
    const seenSerialNumbers = new Set();
    const skusFromFile = new Set();

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2;
      const sku = row.sku?.toString().trim();
      const serialNumber = row.serialNumber?.toString().trim();

      if (!sku || !serialNumber) {
        throw new BadRequestError(
          `Row ${rowNumber} is missing SKU or Serial Number.`
        );
      }

      if (seenSerialNumbers.has(serialNumber)) {
        throw new BadRequestError(
          `Duplicate Serial Number '${serialNumber}' found in the file.`
        );
      }

      seenSerialNumbers.add(serialNumber);
      skusFromFile.add(sku);
      componentsToCreate.push({ sku, serialNumber });
    }

    return { componentsToCreate, skusFromFile, seenSerialNumbers };
  };

  #validateDataWithDatabase = async (
    skusFromFile,
    seenSerialNumbers,
    warehouseId
  ) => {
    const warehouse = await this.#warehouseRepository.findById({ warehouseId });
    if (!warehouse) {
      throw new NotFoundError(`Warehouse with ID '${warehouseId}' not found.`);
    }

    const existingComponents =
      await this.#componentRepository.findComponentsBySerialNumbers([
        ...seenSerialNumbers,
      ]);
    if (existingComponents.length > 0) {
      const existingSerials = existingComponents
        .map((c) => c.serialNumber)
        .join(", ");
      throw new ConflictError(
        `The following Serial Numbers already exist in the system: ${existingSerials}`
      );
    }

    const typeComponents =
      await this.#typeComponentRepository.findTypeComponentsBySkus([
        ...skusFromFile,
      ]);
    const typeComponentMap = new Map(
      typeComponents.map((tc) => [tc.sku, tc.typeComponentId])
    );

    const invalidSkus = [...skusFromFile].filter(
      (sku) => !typeComponentMap.has(sku)
    );
    if (invalidSkus.length > 0) {
      throw new BadRequestError(
        `The following SKUs are invalid: ${invalidSkus.join(", ")}`
      );
    }

    return typeComponentMap;
  };

  #executeInventoryUpdateTransaction = async (
    newComponentsData,
    warehouseId,
    adjustedByUserId,
    adjustmentType,
    reason,
    note
  ) => {
    return db.sequelize.transaction(async (t) => {
      await this.#componentRepository.bulkCreateComponents(newComponentsData, {
        transaction: t,
      });

      const quantityMap = new Map();
      newComponentsData.forEach((item) => {
        quantityMap.set(
          item.typeComponentId,
          (quantityMap.get(item.typeComponentId) || 0) + 1
        );
      });

      for (const [typeComponentId, quantity] of quantityMap.entries()) {
        let stock = await this.#inventoryRepository.findStockForUpdate({
          where: { warehouseId, typeComponentId },
          transaction: t,
        });

        if (stock) {
          await stock.increment("quantityInStock", {
            by: quantity,
            transaction: t,
          });
        } else {
          stock = await this.#inventoryRepository.createStock(
            {
              warehouseId,
              typeComponentId,
              quantityInStock: quantity,
              quantityReserved: 0,
            },
            { transaction: t }
          );
        }

        await this.#inventoryAdjustmentRepository.create(
          {
            stockId: stock.stockId,
            adjustedByUserId,
            adjustmentType,
            quantity,
            reason,
            note: `${note || ""} (Uploaded from Excel)`,
          },
          { transaction: t }
        );
      }

      return {
        success: true,
        message: `Successfully added ${newComponentsData.length} components to inventory.`,
        data: {
          addedCount: newComponentsData.length,
          warehouseId,
        },
      };
    });
  };

  uploadInventoryFromExcel = async ({
    fileBuffer,
    adjustedByUserId,
    warehouseId,
    adjustmentType,
    reason,
    note,
  }) => {
    if (adjustmentType !== "IN") {
      throw new BadRequestError(
        "This endpoint only supports 'IN' adjustment type for Excel uploads."
      );
    }

    const { componentsToCreate, skusFromFile, seenSerialNumbers } =
      this.#parseAndValidateExcelFile(fileBuffer);

    const typeComponentMap = await this.#validateDataWithDatabase(
      skusFromFile,
      seenSerialNumbers,
      warehouseId
    );

    const newComponentsData = componentsToCreate.map((item) => ({
      typeComponentId: typeComponentMap.get(item.sku),
      serialNumber: item.serialNumber,
      warehouseId: warehouseId,
      status: "IN_WAREHOUSE",
    }));

    const result = await this.#executeInventoryUpdateTransaction(
      newComponentsData,
      warehouseId,
      adjustedByUserId,
      adjustmentType,
      reason,
      note
    );

    return result;
  };

  getAdjustmentHistory = async ({
    filters = {},
    roleName,
    companyId,
    serviceCenterId,
  }) => {
    const { page, limit } = filters;

    const whereClause = this.#buildAdjustmentFilters(filters);

    const includeOptions = this.#buildAdjustmentIncludeOptions(
      filters,
      roleName,
      companyId,
      serviceCenterId
    );

    const limitParse = parseInt(limit, 10) || 20;
    const pageParse = parseInt(page, 10) || 1;
    const offset = (pageParse - 1) * limitParse;

    const { rows, count } =
      await this.#inventoryAdjustmentRepository.findAndCountAllAdjustments({
        whereClause,
        includeOptions,
        limit: limitParse,
        offset,
      });

    const totalPages = Math.ceil(count / limitParse);

    return {
      adjustments: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageParse,
        itemsPerPage: limitParse,
      },
    };
  };

  #buildAdjustmentFilters = (filters) => {
    const { adjustedByUserId, startDate, endDate } = filters;
    const whereClause = {};

    if (adjustedByUserId) {
      whereClause.adjustedByUserId = adjustedByUserId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    return whereClause;
  };

  #buildAdjustmentIncludeOptions = (
    filters,
    roleName,
    companyId,
    serviceCenterId
  ) => {
    const { warehouseId, typeComponentId } = filters;

    const includeOptions = [];

    const stockWhere = {};

    if (typeComponentId) {
      stockWhere.typeComponentId = typeComponentId;
    }

    const warehouseWhere = {};

    if (warehouseId) {
      warehouseWhere.warehouseId = warehouseId;
    } else {
      if (roleName === "parts_coordinator_service_center") {
        if (!serviceCenterId) {
          throw new Error("Service center context is required for this role");
        }

        warehouseWhere.serviceCenterId = serviceCenterId;
      } else if (roleName === "parts_coordinator_company") {
        if (!companyId) {
          throw new Error("Company context is required for this role");
        }

        warehouseWhere.vehicleCompanyId = companyId;
      }
    }

    const stockInclude = {
      model: db.Stock,
      as: "stock",
      required: true,
      include: [],
    };

    if (Object.keys(stockWhere).length > 0) {
      stockInclude.where = stockWhere;
    }

    if (Object.keys(warehouseWhere).length > 0) {
      stockInclude.include.push({
        model: db.Warehouse,
        as: "warehouse",
        where: warehouseWhere,
        required: true,
      });
    }

    includeOptions.push(stockInclude);

    return includeOptions;
  };
}

export default InventoryService;
