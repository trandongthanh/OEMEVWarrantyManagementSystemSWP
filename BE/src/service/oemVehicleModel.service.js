import db from "../models/index.cjs";
import { ConflictError, NotFoundError } from "../error/index.js";

const ACTIVE_CASELINE_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "CUSTOMER_APPROVED",
  "WAITING_FOR_PARTS",
  "READY_FOR_REPAIR",
  "PARTS_AVAILABLE",
  "IN_REPAIR",
];

class OemVehicleModelService {
  #oemVehicleModelRepository;
  #warrantyComponentRepository;
  #typeComponentRepository;
  #caselineRepository;

  constructor({
    oemVehicleModelRepository,
    warrantyComponentRepository,
    typeComponentRepository,
    caselineRepository,
  }) {
    this.#oemVehicleModelRepository = oemVehicleModelRepository;
    this.#warrantyComponentRepository = warrantyComponentRepository;
    this.#typeComponentRepository = typeComponentRepository;
    this.#caselineRepository = caselineRepository;
  }

  createVehicleModel = async ({
    vehicleModelName,
    yearOfLaunch,
    placeOfManufacture,
    generalWarrantyDuration,
    generalWarrantyMileage,
    components,
    companyId,
  }) => {
    return db.sequelize.transaction(async (transaction) => {
      const vehicleModelPayload = {
        vehicleModelName,
        yearOfLaunch,
        placeOfManufacture,
        generalWarrantyDuration,
        generalWarrantyMileage,
        vehicleCompanyId: companyId,
      };

      const vehicleModel =
        await this.#oemVehicleModelRepository.createVehicleModel(
          vehicleModelPayload,
          transaction
        );

      const existingComponents = components.filter(
        (component) => !!component.typeComponentId
      );

      const newComponents = components.filter(
        (component) => component.newTypeComponent
      );

      const existingTypeComponentIds = existingComponents.map(
        (component) => component.typeComponentId
      );

      let existingTypeComponents = [];
      if (existingTypeComponentIds.length > 0) {
        existingTypeComponents = await this.#typeComponentRepository.findByIds(
          existingTypeComponentIds,
          transaction
        );

        const existingIds = new Set(
          existingTypeComponents.map((item) => item.typeComponentId)
        );

        const missingIds = existingTypeComponentIds.filter(
          (id) => !existingIds.has(id)
        );

        if (missingIds.length > 0) {
          throw new NotFoundError(
            `Type component is not existing: ${missingIds.join(", ")}`
          );
        }
      }

      const newTypeComponentBySku = new Map();
      for (const component of newComponents) {
        const { newTypeComponent } = component;
        const { sku, name, price, category } = newTypeComponent;

        newTypeComponentBySku.set(sku, {
          name,
          price,
          sku,
          category,
        });
      }

      const skus = Array.from(newTypeComponentBySku.keys());

      const existingTypeComponentsBySku = new Map();

      if (skus.length > 0) {
        const typeComponentsBySku =
          await this.#typeComponentRepository.findBySkus(skus, transaction);

        typeComponentsBySku.forEach((item) => {
          existingTypeComponentsBySku.set(item.sku, item);
        });
      }

      const typeComponentsToCreate = [];

      for (const [sku, info] of newTypeComponentBySku.entries()) {
        if (!existingTypeComponentsBySku.has(sku)) {
          typeComponentsToCreate.push(info);
        }
      }

      let createdTypeComponents = [];
      if (typeComponentsToCreate.length > 0) {
        createdTypeComponents =
          await this.#typeComponentRepository.bulkCreateTypeComponents(
            typeComponentsToCreate,
            transaction
          );
      }

      const typeComponentsBySku = new Map(existingTypeComponentsBySku);

      createdTypeComponents.forEach((item) => {
        typeComponentsBySku.set(item.sku, item);
      });

      const allTypeComponentsMap = new Map();

      existingTypeComponents.forEach((item) => {
        allTypeComponentsMap.set(item.typeComponentId, item);
      });

      typeComponentsBySku.forEach((item) => {
        allTypeComponentsMap.set(item.typeComponentId, item);
      });

      const warrantyComponentsPayload = components.map((component) => {
        let resolvedTypeComponentId;

        if (component.typeComponentId) {
          resolvedTypeComponentId = component.typeComponentId;
        } else {
          const { sku } = component.newTypeComponent;
          const resolvedTypeComponent = typeComponentsBySku.get(sku);

          if (!resolvedTypeComponent) {
            throw new NotFoundError(
              `Không tìm thấy type component tương ứng với SKU ${sku}`
            );
          }

          resolvedTypeComponentId = resolvedTypeComponent.typeComponentId;
        }

        return {
          vehicleModelId: vehicleModel.vehicleModelId,
          typeComponentId: resolvedTypeComponentId,
          quantity: component.quantity,
          durationMonth: component.durationMonth,
          mileageLimit: component.mileageLimit,
        };
      });

      const warrantyComponents =
        await this.#warrantyComponentRepository.bulkCreateWarrantyComponents({
          warrantyComponents: warrantyComponentsPayload,
          transaction,
        });

      return {
        vehicleModel,
        typeComponents: Array.from(allTypeComponentsMap.values()),
        warrantyComponents,
      };
    });
  };

  #ensureVehicleModelExists = async (vehicleModelId, transaction) => {
    const vehicleModel = await this.#oemVehicleModelRepository.findByPk(
      vehicleModelId,
      transaction
    );

    if (!vehicleModel) {
      throw new NotFoundError(
        `Vehicle model with ID ${vehicleModelId} not found`
      );
    }
    return vehicleModel;
  };

  #createNewTypeComponents = async (newTypeComponentsData, transaction) => {
    if (newTypeComponentsData.length === 0) {
      return [];
    }

    const skus = newTypeComponentsData.map((item) => item.sku);

    const existingBySku =
      await this.#typeComponentRepository.findTypeComponentsBySkus(
        skus,
        transaction
      );

    if (existingBySku.length > 0) {
      const existingSkus = existingBySku.map((item) => item.sku).join(", ");
      throw new ConflictError(
        `Type components with these SKUs already exist: ${existingSkus}`
      );
    }

    return this.#typeComponentRepository.bulkCreateTypeComponents(
      newTypeComponentsData,
      transaction
    );
  };

  #buildWarrantyComponentsPayload = (
    vehicleModelId,
    typeComponentWarrantyList,
    createdTypeComponents
  ) => {
    const createdTypeComponentMap = new Map(
      createdTypeComponents.map((c) => [c.sku, c])
    );

    return typeComponentWarrantyList.map((item) => {
      let typeComponentId;

      if (item.typeComponentId) {
        typeComponentId = item.typeComponentId;
      } else {
        const createdComponent = createdTypeComponentMap.get(item.sku);

        if (!createdComponent) {
          throw new Error(
            `Failed to find created type component for SKU: ${item.sku}`
          );
        }

        typeComponentId = createdComponent.typeComponentId;
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

  createWarrantyComponentsForModel = async ({
    vehicleModelId,
    typeComponentWarrantyList,
  }) => {
    const seenIds = new Set();
    const seenSkus = new Set();

    for (const item of typeComponentWarrantyList) {
      if (item.typeComponentId) {
        if (seenIds.has(item.typeComponentId)) {
          throw new ConflictError(
            `Duplicate typeComponentId found in input: ${item.typeComponentId}`
          );
        }
        seenIds.add(item.typeComponentId);
      } else {
        if (seenSkus.has(item.sku)) {
          throw new ConflictError(`Duplicate SKU found in input: ${item.sku}`);
        }
        seenSkus.add(item.sku);
      }
    }

    return db.sequelize.transaction(async (transaction) => {
      await this.#ensureVehicleModelExists(vehicleModelId, transaction);

      const newTypeComponentsData = typeComponentWarrantyList.filter(
        (item) => !item.typeComponentId
      );

      const createdTypeComponents = await this.#createNewTypeComponents(
        newTypeComponentsData,
        transaction
      );

      const warrantyComponentsPayload = this.#buildWarrantyComponentsPayload(
        vehicleModelId,
        typeComponentWarrantyList,
        createdTypeComponents
      );

      return this.#warrantyComponentRepository.bulkCreateWarrantyComponents({
        warrantyComponents: warrantyComponentsPayload,
        transaction,
      });
    });
  };

  updateWarrantyComponent = async ({
    vehicleModelId,
    warrantyComponentId,
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

    if (this.#caselineRepository) {
      const typeComponentIdsToCheck = new Set();
      if (warrantyComponent.typeComponentId) {
        typeComponentIdsToCheck.add(warrantyComponent.typeComponentId);
      }
      if (updateData?.typeComponentId) {
        typeComponentIdsToCheck.add(updateData.typeComponentId);
      }

      for (const typeComponentId of typeComponentIdsToCheck) {
        const activeCount =
          await this.#caselineRepository.countActiveCaseLinesByVehicleModelAndTypeComponent(
            {
              vehicleModelId,
              typeComponentId,
              activeStatuses: ACTIVE_CASELINE_STATUSES,
            }
          );

        if (activeCount > 0) {
          throw new ConflictError(
            "Cannot update warranty component while related repair orders are still in progress."
          );
        }
      }
    }

    return this.#warrantyComponentRepository.updateWarrantyComponent({
      warrantyComponentId,
      updateData,
    });
  };

  getAllModelsWithWarranty = async ({ limit, page }) => {
    const parsePositiveInt = (value, defaultValue) => {
      if (value === undefined || value === null) {
        return defaultValue;
      }

      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return defaultValue;
      }

      return parsed;
    };

    const limitNumber = parsePositiveInt(limit, 10);
    const pageNumber = parsePositiveInt(page, 1);
    const offset = (pageNumber - 1) * limitNumber;

    return this.#oemVehicleModelRepository.getAllModelsWithWarranty({
      limit: limitNumber,
      offset,
    });
  };

  getWarrantyComponentsForModel = async ({ vehicleModelId }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const vehicleModel = await this.#ensureVehicleModelExists(
        vehicleModelId,
        transaction
      );

      if (!vehicleModel) {
        throw new NotFoundError(
          `Vehicle model with ID ${vehicleModelId} not found`
        );
      }

      const warrantyComponents =
        await this.#warrantyComponentRepository.findByVehicleModelId(
          vehicleModelId,
          transaction
        );

      return warrantyComponents;
    });

    return rawResult;
  };
}

export default OemVehicleModelService;
