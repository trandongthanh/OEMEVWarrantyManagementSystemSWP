import { BadRequestError } from "../error/index.js";

class WarehouseService {
  constructor({ wareHouseRepository }) {
    this.wareHouseRepository = wareHouseRepository;
  }

  searchCompatibleComponentsInStock = async ({
    serviceCenterId,
    searchName,
    category,
    modelId,
  }) => {
    if (!serviceCenterId || !modelId) {
      throw new BadRequestError("serviceCenterId, modelId is required");
    }

    if (!searchName && !category) {
      throw new BadRequestError(
        "At least one of searchName or category is required"
      );
    }

    if (!searchName) {
      searchName = "";
    }

    const components =
      await this.wareHouseRepository.searchCompatibleComponentsInStock({
        serviceCenterId: serviceCenterId,
        searchName: searchName,
        category: category,
        modelId: modelId,
      });

    return components;
  };
}

export default WarehouseService;
