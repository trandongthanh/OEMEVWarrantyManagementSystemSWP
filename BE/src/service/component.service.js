import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";
import db from "../models/index.cjs";

const VALID_COMPONENT_STATUSES = new Set([
  "IN_WAREHOUSE",
  "RESERVED",
  "IN_TRANSIT",
  "WITH_TECHNICIAN",
  "INSTALLED",
  "RETURNED",
]);

class ComponentService {
  #componentRepository;
  #warehouseRepository;
  #typeComponentRepository;
  #inventoryRepository;

  constructor({
    componentRepository,
    warehouseRepository,
    typeComponentRepository,
    inventoryRepository,
  }) {
    this.#componentRepository = componentRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#typeComponentRepository = typeComponentRepository;
    this.#inventoryRepository = inventoryRepository;
  }

  listComponents = async (query = {}) => {
    const {
      warehouseId,
      typeComponentId,
      status,
      currentHolderId,
      stockTransferRequestItemId,
      serialNumber,
      limit,
      page,
    } = query;

    const whereCondition = {};
    const { Op } = db.Sequelize;

    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    if (typeComponentId) {
      whereCondition.typeComponentId = typeComponentId;
    }

    if (currentHolderId) {
      whereCondition.currentHolderId = currentHolderId;
    }

    if (stockTransferRequestItemId) {
      whereCondition.stockTransferRequestItemId = stockTransferRequestItemId;
    }

    if (status) {
      if (!VALID_COMPONENT_STATUSES.has(status)) {
        throw new BadRequestError(`Invalid component status value: ${status}`);
      }

      whereCondition.status = status;
    }

    if (serialNumber) {
      whereCondition.serialNumber = serialNumber;
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 50;

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestError("limit must be a positive integer");
    }

    const cappedLimit = Math.min(parsedLimit, 200);

    const parsedPage = page ? parseInt(page, 10) : 1;

    if (Number.isNaN(parsedPage) || parsedPage <= 0) {
      throw new BadRequestError("page must be a positive integer");
    }

    const offset = (parsedPage - 1) * cappedLimit;

    const components = await this.#componentRepository.findAll({
      whereCondition,
      limit: cappedLimit,
      offset,
      includeTypeComponent: true,
    });

    return components;
  };

  createComponent = async ({
    typeComponentId,
    warehouseId,
    serialNumber,
    status = "IN_WAREHOUSE",
  }) => {
    if (!typeComponentId || !warehouseId || !serialNumber) {
      throw new BadRequestError(
        "typeComponentId, warehouseId và serialNumber là bắt buộc"
      );
    }

    const normalizedSerialNumber = serialNumber.trim();

    if (!normalizedSerialNumber) {
      throw new BadRequestError("serialNumber không được bỏ trống");
    }

    if (!VALID_COMPONENT_STATUSES.has(status)) {
      throw new BadRequestError(`Trạng thái component không hợp lệ: ${status}`);
    }

    if (status !== "IN_WAREHOUSE") {
      throw new BadRequestError(
        "Component mới tạo phải ở trạng thái IN_WAREHOUSE"
      );
    }

    return db.sequelize.transaction(async (transaction) => {
      const [typeComponent, warehouse] = await Promise.all([
        this.#typeComponentRepository.findByPk(typeComponentId, transaction),
        this.#warehouseRepository.findById({ warehouseId }, transaction),
      ]);

      if (!typeComponent) {
        throw new NotFoundError("Không tìm thấy type component");
      }

      if (!warehouse) {
        throw new NotFoundError("Không tìm thấy warehouse");
      }

      const existingComponent =
        await this.#componentRepository.findBySerialNumber(
          normalizedSerialNumber,
          transaction,
          transaction.LOCK.UPDATE
        );

      if (existingComponent) {
        throw new ConflictError(
          `Component với serial ${normalizedSerialNumber} đã tồn tại`
        );
      }

      const createdComponent = await this.#componentRepository.createComponent(
        {
          typeComponentId,
          warehouseId,
          serialNumber: normalizedSerialNumber,
          status,
        },
        transaction
      );

      let stockRow = await this.#inventoryRepository.findStockForUpdate({
        where: { warehouseId, typeComponentId },
        transaction,
      });

      if (stockRow) {
        await stockRow.increment("quantityInStock", { by: 1, transaction });
        await stockRow.reload({ transaction });
      } else {
        stockRow = await this.#inventoryRepository.createStock(
          {
            warehouseId,
            typeComponentId,
            quantityInStock: 1,
            quantityReserved: 0,
          },
          { transaction }
        );
      }

      const stockSnapshot =
        typeof stockRow?.toJSON === "function" ? stockRow.toJSON() : stockRow;

      return {
        component: createdComponent,
        stock: stockSnapshot
          ? {
              stockId: stockSnapshot.stockId,
              warehouseId: stockSnapshot.warehouseId,
              typeComponentId: stockSnapshot.typeComponentId,
              quantityInStock: stockSnapshot.quantityInStock,
              quantityReserved: stockSnapshot.quantityReserved,
            }
          : null,
      };
    });
  };
}

export default ComponentService;
