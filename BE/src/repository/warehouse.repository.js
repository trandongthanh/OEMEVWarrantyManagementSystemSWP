import { Op, Transaction } from "sequelize";
import db from "../models/index.cjs";

const {
  Warehouse,
  TypeComponent,
  VehicleModel,
  Stock,
  ServiceCenter,
  VehicleCompany,
} = db;

class WareHouseRepository {
  searchCompatibleComponentsInStock = async ({
    serviceCenterId,
    searchName,
    category,
    modelId,
  }) => {
    const warehouses = await Warehouse.findAll({
      where: {
        serviceCenterId: serviceCenterId,
      },

      attributes: ["warehouseId"],
    });

    const warehouseIds = warehouses.map((warehouse) => warehouse.warehouseId);

    if (!warehouses || warehouses.length === 0) {
      return [];
    }

    const typeComponents = await TypeComponent.findAll({
      where: {
        category: category ? category : { [Op.ne]: null },
        name: {
          [Op.like]: `%${searchName}%`,
        },
      },

      attributes: ["typeComponentId", "name", "price"],

      include: [
        {
          model: VehicleModel,
          as: "vehicleModels",
          attributes: [],

          where: {
            vehicleModelId: modelId,
          },

          required: true,
        },

        {
          model: Warehouse,
          as: "warehouses",
          attributes: ["name"],
          where: {
            warehouseId: {
              [Op.in]: warehouseIds,
            },
          },
          required: false,
        },
      ],
    });

    return typeComponents.map((typeComponent) => typeComponent.toJSON());
  };

  findStocksByTypeComponentOrderByWarehousePriority = async (
    { typeComponentIds, context, entityId, vehicleModelId },
    transaction = null,
    lock = null
  ) => {
    let warehouseWhereCondition = {};
    let serviceCenterId;
    let vehicleCompanyId;

    if (context === "SERVICE_CENTER") {
      if (!entityId)
        throw new Error(
          "serviceCenterId (entityId) is required for SERVICE_CENTER context"
        );
      serviceCenterId = entityId;
      warehouseWhereCondition = { serviceCenterId: serviceCenterId };
    } else if (context === "COMPANY" || context === "OEM") {
      if (!entityId)
        throw new Error(
          "vehicleCompanyId (entityId) is required for OEM context"
        );

      vehicleCompanyId = entityId;
      warehouseWhereCondition = {
        vehicleCompanyId: vehicleCompanyId,
        serviceCenterId: null,
      };
    } else {
      throw new Error(
        "Invalid context provided. Use 'SERVICE_CENTER' or 'OEM'."
      );
    }

    let vehicleModelWhereCondition = {};
    if (vehicleModelId) {
      vehicleModelWhereCondition = { vehicleModelId: vehicleModelId };
    }

    const warehouses = await Warehouse.findAll({
      where: warehouseWhereCondition,
      attributes: ["warehouseId", "priority"],
      transaction: transaction,
      lock: lock,
    });

    const warehousesId = warehouses.map((warehouse) => warehouse.warehouseId);

    const stocks = await Stock.findAll({
      where: {
        warehouseId: {
          [Op.in]: warehousesId,
        },

        typeComponentId: {
          [Op.in]: typeComponentIds,
        },

        [Op.and]: db.Sequelize.where(
          db.Sequelize.col("Stock.quantity_reserved"),
          "<",
          db.Sequelize.col("Stock.quantity_in_stock")
        ),
      },
      transaction: transaction,
      lock: lock,

      attributes: [
        "stockId",
        "quantityInStock",
        "quantityReserved",
        "quantityAvailable",
      ],

      include: [
        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["typeComponentId"],
          required: true,
          include: [
            {
              model: VehicleModel,
              as: "vehicleModels",
              attributes: ["vehicleModelId"],
              required: !!vehicleModelId,
              where: vehicleModelWhereCondition,
            },
          ],
        },
        {
          model: Warehouse,
          as: "warehouse",
          attributes: ["warehouseId", "priority"],
        },
      ],

      order: [[{ model: Warehouse, as: "warehouse" }, "priority", "ASC"]],
    });

    if (!stocks) {
      return null;
    }

    const stockJSON = stocks.map((stock) => stock.toJSON());

    return stockJSON;
  };

  bulkUpdateStockQuantities = async (stockUpdates, transaction = null) => {
    if (!stockUpdates) {
      return [];
    }

    const updates = Array.isArray(stockUpdates) ? stockUpdates : [stockUpdates];

    const affectedIds = [];

    for (const update of updates) {
      if (!update || !update.stockId) {
        continue;
      }

      const updateFields = {};

      if (update.quantityInStock) {
        const quantityInStock = Number(update.quantityInStock);
        updateFields.quantityInStock = db.Sequelize.literal(
          `quantity_in_stock + ${quantityInStock}`
        );
      }

      if (update.quantityReserved) {
        const quantityReserved = Number(update.quantityReserved);
        updateFields.quantityReserved = db.Sequelize.literal(
          `quantity_reserved + ${quantityReserved}`
        );
      }

      if (Object.keys(updateFields).length === 0) {
        continue;
      }

      await Stock.update(updateFields, {
        where: { stockId: update.stockId },
        transaction,
      });

      affectedIds.push(update.stockId);
    }

    if (affectedIds.length === 0) {
      return [];
    }

    const updatedStocks = await Stock.findAll({
      where: {
        stockId: {
          [Op.in]: affectedIds,
        },
      },
      transaction,
    });

    return updatedStocks.map((stock) => stock.toJSON());
  };

  findStocksByIds = async ({ stockIds }, transaction = null, lock = null) => {
    const stocks = await Stock.findAll({
      where: {
        stockId: {
          [Op.in]: stockIds,
        },
      },
      include: [
        {
          model: Warehouse,
          as: "warehouse",
          attributes: ["warehouseId", "name", "priority"],
        },
        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["typeComponentId", "name"],
        },
      ],
      transaction,
      lock,
    });

    return stocks.map((stock) => stock.toJSON());
  };

  findStockItem = async (
    { warehouseId, typeComponentId },
    transaction = null,
    lock = null
  ) => {
    const stockItem = await Stock.findOne({
      where: {
        warehouseId: warehouseId,
        typeComponentId: typeComponentId,
      },
      transaction: transaction,
      lock: lock,
    });

    return stockItem ? stockItem.toJSON() : null;
  };

  updateStockItem = async (
    { warehouseId, typeComponentId, quantityInStock, quantityReserved },
    transaction = null
  ) => {
    const [affectedRows] = await Stock.update(
      {
        quantityInStock: quantityInStock,
        quantityReserved: quantityReserved,
      },
      {
        where: {
          warehouseId: warehouseId,
          typeComponentId: typeComponentId,
        },
        transaction: transaction,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    const updatedStockItem = await Stock.findOne({
      where: {
        warehouseId: warehouseId,
        typeComponentId: typeComponentId,
      },
      transaction: transaction,
    });

    return updatedStockItem ? updatedStockItem.toJSON() : null;
  };

  getAllWarehouses = async ({ whereClause = {} } = {}) => {
    const warehouses = await Warehouse.findAll({
      where: whereClause,
      attributes: [
        "warehouseId",
        "name",
        "address",
        "priority",
        "serviceCenterId",
        "vehicleCompanyId",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: ServiceCenter,
          as: "serviceCenter",
          attributes: ["serviceCenterId", "name", "address"],
          required: false,
        },
        {
          model: VehicleCompany,
          as: "company",
          attributes: ["vehicleCompanyId", "name"],
          required: false,
        },
        {
          model: Stock,
          as: "stocks",
          attributes: [
            "stockId",
            "typeComponentId",
            "quantityInStock",
            "quantityReserved",
            "quantityAvailable",
          ],
          include: [
            {
              model: TypeComponent,
              as: "typeComponent",
              attributes: ["typeComponentId", "name", "sku", "category"],
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    return warehouses.map((warehouse) => warehouse.toJSON());
  };

  findStockByWarehouseAndTypeComponent = async (
    { warehouseId, typeComponentId },
    transaction = null,
    lock = null
  ) => {
    const stock = await Stock.findOne({
      where: {
        warehouseId: warehouseId,
        typeComponentId: typeComponentId,
      },
      transaction: transaction,
      lock: lock,
    });

    return stock ? stock.toJSON() : null;
  };

  findById = async ({ warehouseId }, transaction = null, lock = null) => {
    const warehouse = await Warehouse.findOne({
      where: {
        warehouseId: warehouseId,
      },
      transaction: transaction,
      lock: lock,
    });

    return warehouse ? warehouse.toJSON() : null;
  };

  createStock = async (
    { warehouseId, typeComponentId, quantityInStock, quantityReserved },
    transaction = null
  ) => {
    const newStock = await Stock.create(
      {
        warehouseId,
        typeComponentId,
        quantityInStock,
        quantityReserved,
      },
      {
        transaction,
      }
    );

    return newStock ? newStock.toJSON() : null;
  };
}

export default WareHouseRepository;
