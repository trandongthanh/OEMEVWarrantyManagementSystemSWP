import { Transaction } from "sequelize";
import db from "../models/index.cjs";
import { NotFoundError } from "../error/index.js";

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

  async createInventoryAdjustment(adjustmentData) {
    const {
      stockId,
      adjustmentType,
      quantity,
      reason,
      note,
      adjustedByUserId,
      roleName,
      companyId,
    } = adjustmentData;

    const result = await db.sequelize.transaction(async (transaction) => {
      const stock = await this.#warehouseRepository.findStockByStockId(
        stockId,
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!stock) {
        throw new NotFoundError("Stock item not found");
      }

      if (adjustmentType === "OUT" && stock.quantityAvailable < quantity) {
        throw new Error(
          `Insufficient available stock. Available: ${stock.quantityAvailable}, Requested: ${quantity}`
        );
      }

      const existingUser = await this.#userRepository.findUserById(
        { userId: adjustedByUserId },
        transaction,
        Transaction.LOCK.SHARE
      );

      if (!existingUser) {
        throw new NotFoundError("Adjusting user not found");
      }

      const newAdjustment =
        await this.#inventoryAdjustmentRepository.createInventoryAdjustment(
          {
            stockId,
            adjustmentType,
            quantity,
            reason,
            note,
            adjustedByUserId,
          },
          transaction
        );

      let updatedStock;
      if (adjustmentType === "IN") {
        updatedStock = await this.#warehouseRepository.updateStockQuantities(
          {
            stockId,
            quantityInStock: stock.quantityInStock + quantity,
          },
          transaction
        );
      } else if (adjustmentType === "OUT") {
        updatedStock = await this.#warehouseRepository.updateStockQuantities(
          {
            stockId,
            quantityInStock: stock.quantityInStock - quantity,
          },
          transaction
        );
      }

      return { adjustment: newAdjustment, updatedStock, stock };
    });

    const { adjustment, updatedStock, stock } = result;

    if (roleName === "parts_coordinator_company" && companyId) {
      this.#notificationService.sendToRoom(
        `parts_coordinator_company_${companyId}`,
        "inventory_adjustment_created",
        {
          adjustment,
          updatedStock,
          adjustmentType,
          quantity,
          reason,
        }
      );
    } else if (stock.warehouse?.serviceCenterId) {
      this.#notificationService.sendToRoom(
        `parts_coordinator_service_center_${stock.warehouse.serviceCenterId}`,
        "inventory_adjustment_created",
        {
          adjustment,
          updatedStock,
          adjustmentType,
          quantity,
          reason,
        }
      );
    }

    return { adjustment, updatedStock };
  }
}

export default InventoryService;
