import { col, fn, literal } from "sequelize";
import db from "../models/index.cjs";

const { Stock, Warehouse, TypeComponent } = db;

class InventoryRepository {
  getInventorySummary = async ({ warehouseWhereClause = {} }) => {
    const stockItems = await Stock.findAll({
      attributes: [
        "warehouseId",
        [fn("SUM", col("quantity_in_stock")), "totalInStock"],
        [fn("SUM", col("quantity_reserved")), "totalReserved"],
        [
          fn("SUM", literal("quantity_in_stock - quantity_reserved")),
          "totalAvailable",
        ],
      ],
      include: [
        {
          model: Warehouse,
          as: "warehouse",
          attributes: [
            "warehouseId",
            "name",
            "serviceCenterId",
            "vehicleCompanyId",
          ],
          where: Object.keys(warehouseWhereClause).length
            ? warehouseWhereClause
            : undefined,
          required: Object.keys(warehouseWhereClause).length > 0,
        },
      ],

      group: [
        "warehouseId",
        "warehouse.warehouse_id",
        "warehouse.name",
        "warehouse.service_center_id",
        "warehouse.vehicle_company_id",
      ],

      order: [[{ model: Warehouse, as: "warehouse" }, "name", "ASC"]],
    });

    return stockItems.map((item) => item.toJSON());
  };

  getInventoryTypeComponents = async ({
    warehouseWhereClause = {},
    typeComponentId,
    offset = 1,
    limit = 10,
  }) => {
    const whereClause = {};

    if (typeComponentId) {
      whereClause.typeComponentId = typeComponentId;
    }

    const { rows, count } = await Stock.findAndCountAll({
      where: whereClause,

      attributes: [
        "stockId",
        "warehouseId",
        "typeComponentId",
        "quantityInStock",
        "quantityReserved",
        "quantityAvailable",
      ],

      include: [
        {
          model: Warehouse,
          as: "warehouse",
          attributes: [
            "warehouseId",
            "name",
            "serviceCenterId",
            "vehicleCompanyId",
          ],
          where:
            Object.keys(warehouseWhereClause).length > 0
              ? warehouseWhereClause
              : undefined,

          required: Object.keys(warehouseWhereClause).length > 0,
        },

        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["typeComponentId", "name", "sku", "category", "price"],
          required: true,
        },
      ],

      order: [
        [{ model: TypeComponent, as: "typeComponent" }, "name", "ASC"],
        [{ model: Warehouse, as: "warehouse" }, "name", "ASC"],
      ],

      distinct: true,

      limit,
      offset,
    });

    return {
      rows: rows.map((row) => row.toJSON()),
      count,
    };
  };
}

export default InventoryRepository;
