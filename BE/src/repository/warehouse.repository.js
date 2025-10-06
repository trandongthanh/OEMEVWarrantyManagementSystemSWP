import { Op } from "sequelize";
import db from "../../models/index.cjs";

const { Warehouse, TypeComponent, VehicleModel } = db;

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
              "quantityInStock",
              "quantityReserved",
              "quantityAvailable",
            ],
          },

          required: false,
        },
      ],
    });

    return components.map((component) => component.toJSON());
  };
}

export default WareHouseRepository;
