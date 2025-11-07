import XlSX from "xlsx";
import fs from "fs";
import path from "path";

class InventoryService {
  #inventoryRepository;
  #inventoryAdjustmentRepository;
  #warehouseRepository;
  #userRepository;
  #notificationService;

  constructor({
    inventoryRepository,
    inventoryAdjustmentRepository,
    warehouseRepository,
    userRepository,
    notificationService,
  }) {
    this.#inventoryRepository = inventoryRepository;
    this.#inventoryAdjustmentRepository = inventoryAdjustmentRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#userRepository = userRepository;
    this.#notificationService = notificationService;
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

  uploadInventoryFromExcel = async ({
    fileBuffer,
    adjustedByUserId,
    warehouseId,
    adjustmentType,
    reason,
    note,
  }) => {
    const workbook = XlSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XlSX.utils.sheet_to_json(worksheet, { defval: null });
  };
}

export default InventoryService;
