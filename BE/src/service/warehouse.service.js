import { BadRequestError } from "../error/index.js";

class WarehouseService {
  #warehouseRepository;
  #vehicleService;
  constructor({ warehouseRepository, vehicleService }) {
    this.#warehouseRepository = warehouseRepository;
    this.#vehicleService = vehicleService;
  }

  searchCompatibleComponentsInStock = async ({
    serviceCenterId,
    searchName,
    category,
    modelId,
    vin: vin,
    odometer: odometer,
    companyId: companyId,
  }) => {
    if (!serviceCenterId || !modelId) {
      throw new BadRequestError("serviceCenterId, modelId is required");
    }

    if (!vin) {
      throw new BadRequestError("Vehicle VIN is required");
    }

    if (odometer === null || odometer === undefined) {
      throw new BadRequestError("Odometer reading is required");
    }

    if (!searchName) {
      searchName = "";
    }

    const [typeComponents, vehicleWarranty] = await Promise.all([
      await this.#warehouseRepository.searchCompatibleComponentsInStock({
        serviceCenterId: serviceCenterId,
        searchName: searchName,
        category: category,
        modelId: modelId,
      }),

      await this.#vehicleService.findVehicleByVinWithWarranty({
        odometer: odometer,
        vin: vin,
        companyId: companyId,
      }),
    ]);

    const componentWarranties = vehicleWarranty.componentWarranties || [];
    const typeComponentWarranties = componentWarranties
      .filter(({ duration, mileage }) => duration && mileage)
      .map((typeComponent) => {
        return {
          typeComponentId: typeComponent.typeComponentId,
          duration: typeComponent?.duration?.status,
          mileage: typeComponent?.mileage?.status,
        };
      });

    const typeComponentsUnderWarranty = typeComponentWarranties
      .filter(
        ({ duration, mileage }) => duration === "ACTIVE" && mileage === "ACTIVE"
      )
      .map(({ typeComponentId }) => typeComponentId);

    for (const typeComponent of typeComponents) {
      if (typeComponentsUnderWarranty.includes(typeComponent.typeComponentId)) {
        typeComponent.isUnderWarranty = true;
      }
    }

    return typeComponents;
  };

  getAllWarehouses = async ({
    roleName,
    serviceCenterId,
    companyId,
    filters = {},
  }) => {
    const whereClause = {};

    if (
      ["service_center_manager", "parts_coordinator_service_center"].includes(
        roleName
      )
    ) {
      if (!serviceCenterId) {
        throw new BadRequestError("Service center context is required");
      }

      whereClause.serviceCenterId = serviceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      if (!companyId) {
        throw new BadRequestError("Company context is required");
      }

      whereClause.vehicleCompanyId = companyId;

      if (filters?.serviceCenterId) {
        whereClause.serviceCenterId = filters.serviceCenterId;
      }
    } else if (serviceCenterId) {
      whereClause.serviceCenterId = serviceCenterId;
    }

    const warehouses = await this.#warehouseRepository.getAllWarehouses({
      whereClause,
    });

    if (!warehouses || warehouses.length === 0) {
      return [];
    }

    return warehouses;
  };
}

export default WarehouseService;
