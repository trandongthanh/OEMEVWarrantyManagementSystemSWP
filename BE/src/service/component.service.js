import { BadRequestError } from "../error/index.js";
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

  constructor({ componentRepository }) {
    this.#componentRepository = componentRepository;
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
}

export default ComponentService;
