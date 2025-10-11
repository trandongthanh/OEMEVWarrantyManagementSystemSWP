import { Op } from "sequelize";
import db from "../models/index.cjs";
// import {  } from "joi";

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

    const components = await TypeComponent.findAll({
      where: {
        category: category,
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

          through: {
            attributes: [],
          },

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
          through: {
            attributes: [
              // "quantityInStock",
              // "quantityReserved",
              // "quantityAvailable",
            ],
          },

          required: false,
        },
      ],
    });

    return components.map((component) => component.toJSON());
  };

  findStocksByTypeComponentOrderByWarehousePriority = async (
    { typeComponentIds, serviceCenterId, vehicleModelId },
    option = null
  ) => {
    const warehouses = await Warehouse.findAll({
      where: {
        serviceCenterId: serviceCenterId,
      },

      transaction: option,
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
      },
      transaction: option,

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

          // through: {
          //   attributes: [],
          // },

          include: [
            {
              model: VehicleModel,
              as: "vehicleModels",
              attributes: ["vehicleModelId"],
              required: true,
              where: {
                vehicleModelId: vehicleModelId,
              },
              through: {
                attributes: [],
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

  bulkUpdateStockQuantities = async ({ reservations }, option = null) => {
    if (!reservations || reservations.length === 0) {
      return;
    }

    const stockIds = reservations.map((reservation) => reservation.stockId);

    const reservedCase = reservations
      .map((reservation) => {
        `WHEN stockId = '${reservation.stockId}' THEN quantityReserved = ${reservation.quantity}`;
      })
      .join(" ");

    const [rowEffect] = await Stock.update(
      {
        quantityReserved: db.sequelize.literal(
          `quantity_reserved + (CASE ${reservedCase}) ELSE 0 END`
        ),
      },
      {
        where: {
          stockId: {
            [Op.in]: stockIds,
          },
        },
        transaction: option,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedStocks = await Stock.findAll({
      where: {
        [Op.in]: stockIds,
        transaction: option,
      },
    });

    return updatedStocks.map((updatedStock) => updatedStock.toJSON());
  };
}

export default WareHouseRepository;
