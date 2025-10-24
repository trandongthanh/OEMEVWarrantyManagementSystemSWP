import { Op, Transaction } from "sequelize";
import db from "../models/index.cjs";

const { Warehouse, TypeComponent, VehicleModel, Stock } = db;

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
    { typeComponentIds, serviceCenterId, vehicleModelId },
    transaction = null,
    lock = null
  ) => {
    const warehouses = await Warehouse.findAll({
      where: {
        serviceCenterId: serviceCenterId,
      },

      transaction: transaction,
      lock: Transaction.LOCK.SHARE,
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

          include: [
            {
              model: VehicleModel,
              as: "vehicleModels",
              attributes: ["vehicleModelId"],
              required: true,
              where: {
                vehicleModelId: vehicleModelId,
              },
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

  bulkUpdateStockQuantities = async ({ reservations }, transaction = null) => {
    if (!reservations || reservations.length === 0) {
      return [];
    }

    const caseWhenClauses = [];
    const stockIds = [];
    const replacements = {};

    reservations.forEach((reservation, index) => {
      const stockIdKey = `stockId${index}`;
      const quantityKey = `quantity${index}`;

      stockIds.push(reservation.stockId);
      replacements[stockIdKey] = reservation.stockId;
      replacements[quantityKey] = reservation.quantityReserved;

      caseWhenClauses.push(
        `WHEN stock_id = :${stockIdKey} THEN :${quantityKey}`
      );
    });

    replacements.stockIds = stockIds;

    const sqlStr = `
      UPDATE stock 
      SET quantity_reserved = quantity_reserved + (
        CASE 
          ${caseWhenClauses.join(" ")}
          ELSE 0 
        END
      )
      WHERE stock_id IN (:stockIds)
    `;

    const [result] = await db.sequelize.query(sqlStr, {
      replacements: replacements,
      transaction: transaction,
    });

    if (!result || result === 0) {
      return [];
    }

    const updatedStocks = await Stock.findAll({
      where: {
        stockId: {
          [Op.in]: stockIds,
        },
      },
      transaction: transaction,
    });

    return updatedStocks.map((updatedStock) => updatedStock.toJSON());
  };
}

export default WareHouseRepository;
