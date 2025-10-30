import db from "../models/index.cjs";
import { ConflictError, NotFoundError } from "../error/index.js";

class OemVehicleModelService {
  #oemVehicleModelRepository;
  #vehicleModelRepository;
  #warrantyComponentRepository;
  #typeComponentRepository;

  constructor(
    oemVehicleModelRepository,
    vehicleModelRepository,
    warrantyComponentRepository,
    typeComponentRepository
  ) {
    this.#oemVehicleModelRepository = oemVehicleModelRepository;
    this.#vehicleModelRepository = vehicleModelRepository;
    this.#warrantyComponentRepository = warrantyComponentRepository;
    this.#typeComponentRepository = typeComponentRepository;
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
      const vehicleModel =
        await this.#oemVehicleModelRepository.createVehicleModel(
          {
            vehicleModelName,
            yearOfLaunch,
            placeOfManufacture,
            generalWarrantyDuration,
            generalWarrantyMileage,
            companyId,
          },
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
          const resolvedTypeComponent = typeComponentBySku.get(sku);

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
}

export default OemVehicleModelService;
