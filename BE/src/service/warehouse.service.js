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

    // if (!searchName && !category) {
    //   throw new BadRequestError(
    //     "At least one of searchName or category is required"
    //   );
    // }

    if (!searchName) {
      searchName = "";
    }

    const components =
      await this.#warehouseRepository.searchCompatibleComponentsInStock({
        serviceCenterId: serviceCenterId,
        searchName: searchName,
        category: category,
        modelId: modelId,
      });

    const vehicleWarranty =
      await this.#vehicleService.findVehicleByVinWithWarranty({
        odometer: odometer,
        vin: vin,
        companyId: companyId,
      });

    const componentWarrantys = vehicleWarranty?.componentWarranties?.map(
      (component) => {
        return {
          typeComponentId: component.typeComponentId,
          duration: component?.duration?.status,
          mileage: component?.mileage?.status,
        };
      }
    );

    const componentsUnderWarranty = [];
    componentWarrantys.forEach((component) => {
      if (component.duration === "ACTIVE" && component.mileage === "ACTIVE") {
        componentsUnderWarranty.push(component.typeComponentId);
      }
    });

    for (const component of components) {
      if (componentsUnderWarranty.includes(component.typeComponentId)) {
        component.isUnderWarranty = true;
      }
    }

    return components;
  };
}

export default WarehouseService;
