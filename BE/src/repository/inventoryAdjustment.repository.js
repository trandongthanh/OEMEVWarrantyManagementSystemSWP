import { Op } from "sequelize";
import db from "../models/index.cjs";

const {
  InventoryAdjustment,
  Stock,
  Warehouse,
  TypeComponent,
  User,
  ServiceCenter,
} = db;

class InventoryAdjustmentRepository {
  create = async (adjustmentData, options = {}) => {
    const record = await InventoryAdjustment.create(adjustmentData, options);
    return record.toJSON();
  };

  findAndCountAllAdjustments = async ({
    whereClause = {},
    includeOptions = [],
    limit,
    offset,
  }) => {
    const { rows, count } = await InventoryAdjustment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "adjustedByUser",
          attributes: ["userId", "name", "email"],
          required: true,
        },
        {
          model: Stock,
          as: "stock",
          attributes: ["stockId", "warehouseId", "typeComponentId"],
          required: true,
          include: [
            {
              model: TypeComponent,
              as: "typeComponent",
              attributes: ["name", "sku"],
              required: true,
            },
            {
              model: Warehouse,
              as: "warehouse",
              attributes: ["name"],
              required: true,
              include: [
                {
                  model: ServiceCenter,
                  as: "serviceCenter",
                  attributes: ["name"],
                  required: false,
                },
              ],
            },
          ],
        },
        ...includeOptions,
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return { rows: rows.map((row) => row.toJSON()), count };
  };
}

export default InventoryAdjustmentRepository;
