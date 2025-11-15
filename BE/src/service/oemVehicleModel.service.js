import db from "../models/index.cjs";
import { ConflictError, NotFoundError } from "../error/index.js";

class OemVehicleModelService {
  #oemVehicleModelRepository;
  #warrantyComponentRepository;
  #typeComponentRepository;

  constructor({
    oemVehicleModelRepository,
    warrantyComponentRepository,
    typeComponentRepository,
  }) {
    this.#oemVehicleModelRepository = oemVehicleModelRepository;
    this.#warrantyComponentRepository = warrantyComponentRepository;
    this.#typeComponentRepository = typeComponentRepository;
  }

  createVehicleModel = async (vehicleModelData) => {
    const existingModel =
      await this.#oemVehicleModelRepository.findByVehicleModelName(
        vehicleModelData.vehicleModelName
      );

    if (existingModel) {
      throw new ConflictError(
        `Vehicle model with name '${vehicleModelData.vehicleModelName}' already exists.`
      );
    }
    return this.#oemVehicleModelRepository.create(vehicleModelData);
  };

  getAllModelsWithWarranty = async () => {
    return this.#oemVehicleModelRepository.findAllWithWarrantyComponents();
  };

  getWarrantyComponentsForModel = async ({ vehicleModelId }) => {
    await this.#ensureVehicleModelExists(vehicleModelId);
    return this.#warrantyComponentRepository.findByVehicleModelId(
      vehicleModelId
    );
  };

  updateWarrantyComponent = async ({
    warrantyComponentId,
    vehicleModelId,
    updateData,
  }) => {
    const warrantyComponent = await this.#warrantyComponentRepository.findByPk(
      warrantyComponentId
    );

    if (!warrantyComponent) {
      throw new NotFoundError(
        `Warranty component with ID ${warrantyComponentId} not found.`
      );
    }

    if (warrantyComponent.vehicleModelId !== vehicleModelId) {
      throw new ConflictError(
        `Warranty component ${warrantyComponentId} does not belong to vehicle model ${vehicleModelId}.`
      );
    }

    return this.#warrantyComponentRepository.update(
      warrantyComponentId,
      updateData
    );
  };

  createWarrantyComponentsForModel = async ({
    vehicleModelId,
    typeComponentWarrantyList,
  }) => {
    this.#validateDuplicates(typeComponentWarrantyList);

    return db.sequelize.transaction(async (transaction) => {
      await this.#ensureVehicleModelExists(vehicleModelId, transaction);

      const { existingIds, newComponentData } = this.#separateComponents(
        typeComponentWarrantyList
      );

      await this.#validateExistingTypeComponents(existingIds, transaction);

      const createdTypeComponents = await this.#createOrFindTypeComponents(
        newComponentData,
        transaction
      );

      const warrantyPayload = this.#buildWarrantyComponentsPayload(
        vehicleModelId,
        typeComponentWarrantyList,
        new Map(createdTypeComponents.map((c) => [c.sku, c]))
      );

      return this.#warrantyComponentRepository.bulkCreate(
        warrantyPayload,
        transaction
      );
    });
  };

  #validateDuplicates = (list) => {
    const seenIds = new Set();
    const seenSkus = new Set();
    for (const item of list) {
      if (item.typeComponentId) {
        if (seenIds.has(item.typeComponentId))
          throw new ConflictError(
            `Duplicate typeComponentId: ${item.typeComponentId}`
          );
        seenIds.add(item.typeComponentId);
      } else if (item.sku) {
        if (seenSkus.has(item.sku))
          throw new ConflictError(`Duplicate SKU: ${item.sku}`);
        seenSkus.add(item.sku);
      }
    }
  };

  #ensureVehicleModelExists = async (vehicleModelId, transaction) => {
    const model = await this.#oemVehicleModelRepository.findByPk(
      vehicleModelId,
      transaction
    );
    if (!model) {
      throw new NotFoundError(
        `Vehicle model with ID ${vehicleModelId} not found.`
      );
    }
    return model;
  };

  #separateComponents = (list) => {
    const existingIds = [];
    const newComponentData = [];
    list.forEach((item) => {
      if (item.typeComponentId) {
        existingIds.push(item.typeComponentId);
      } else {
        newComponentData.push(item);
      }
    });
    return { existingIds, newComponentData };
  };

  #validateExistingTypeComponents = async (ids, transaction) => {
    if (ids.length === 0) return;
    const found = await this.#typeComponentRepository.findByIds(
      ids,
      transaction
    );
    const foundIds = new Set(found.map((c) => c.typeComponentId));
    const notFound = ids.filter((id) => !foundIds.has(id));
    if (notFound.length > 0) {
      throw new NotFoundError(
        `Type components not found: ${notFound.join(", ")}`
      );
    }
  };

  #createOrFindTypeComponents = async (newComponentData, transaction) => {
    if (newComponentData.length === 0) return [];

    const skus = newComponentData.map((item) => item.sku);
    const existingBySku = await this.#typeComponentRepository.findBySkus(
      skus,
      transaction
    );
    const existingSkuMap = new Map(existingBySku.map((c) => [c.sku, c]));

    const componentsToCreate = newComponentData.filter(
      (item) => !existingSkuMap.has(item.sku)
    );

    if (componentsToCreate.length > 0) {
      const created = await this.#typeComponentRepository.bulkCreate(
        componentsToCreate.map(({ sku, name, price, category, makeBrand }) => ({
          sku,
          name,
          price,
          category,
          makeBrand,
        })),
        transaction
      );
      created.forEach((c) => existingSkuMap.set(c.sku, c));
    }

    return Array.from(existingSkuMap.values());
  };

  #buildWarrantyComponentsPayload = (vehicleModelId, list, createdMap) => {
    return list.map((item) => {
      let typeComponentId = item.typeComponentId;
      if (!typeComponentId) {
        const created = createdMap.get(item.sku);
        if (!created) throw new Error(`Failed to resolve SKU: ${item.sku}`);
        typeComponentId = created.typeComponentId;
      }
      return {
        vehicleModelId,
        typeComponentId,
        quantity: item.quantity,
        durationMonth: item.durationMonth,
        mileageLimit: item.mileageLimit,
      };
    });
  };
}

export default OemVehicleModelService;
