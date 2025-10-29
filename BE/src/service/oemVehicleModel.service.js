import db from "../models/index.cjs";

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
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const newVehicleModel =
        await this.#oemVehicleModelRepository.createVehicleModel({
          vehicleModelName,
          yearOfLaunch,
          placeOfManufacture,
          generalWarrantyDuration,
          generalWarrantyMileage,
          companyId,
        });

      const typeComponentsData = [];
      const typeComponentIds = [];
      const newTypeComponents = [];
      const warrantyComponentsData = [];

      for (const component of components) {
        if (component.typeComponentId) {
          typeComponentIds.push(component.typeComponentId);

          warrantyComponentsData.push({
            vehicleModelId: newVehicleModel.vehicleModelId,
            typeComponentId: component.typeComponentId,
            quantity: component.quantity,
            durationMonth: component.durationMonth,
            mileageLimit: component.mileageLimit,
          });

          continue;
        }

        typeComponentsData.push({
          name: component.name,
          price: component.price,
          sku: component.sku,
          category: component.category,
          quantity: component.quantity,
          durationMonth: component.durationMonth,
          mileageLimit: component.mileageLimit,
        });
      }

      const allTypeComponents = await this.#typeComponentRepository.findByIds(
        typeComponentIds,
        transaction
      );

      if (
        !allTypeComponents ||
        allTypeComponents.length !== typeComponentIds.length
      ) {
        throw new Error("Some type components not found");
      }

      for (const typeComponent of allTypeComponents) {
        newTypeComponents.push(typeComponent);
      }

      const typeComponentsToCreateFiltered = typeComponentsData.map((tc) => {
        return {
          name: tc.name,
          price: tc.price,
          sku: tc.sku,
          category: tc.category,
        };
      });

      if (typeComponentsToCreateFiltered.length > 0) {
        const createdTypeComponents =
          await this.#typeComponentRepository.bulkCreateTypeComponents(
            typeComponentsToCreateFiltered,
            transaction
          );

        newTypeComponents.push(...createdTypeComponents);
      }

      for (const typeComponent of newTypeComponents) {
        const componentInput = components.find((comp) => {
          return comp.typeComponentId === typeComponent.typeComponentId;
        });

        if (componentInput) {
          await this.#warrantyComponentRepository.createWarrantyComponent({
            vehicleModelId: newVehicleModel.vehicleModelId,
            typeComponentId: typeComponent.typeComponentId,
            quantity: componentInput.quantity,
            durationMonth: componentInput.durationMonth,
            mileageLimit: componentInput.mileageLimit,
            transaction,
          });
        }

        const newTypeComponentInput = components.find((comp) => {
          return (
            comp.newTypeComponent &&
            comp.newTypeComponent.name === typeComponent.name &&
            comp.newTypeComponent.sku === typeComponent.sku
          );
        });

        if (newTypeComponentInput) {
          await this.#warrantyComponentRepository.createWarrantyComponent({
            vehicleModelId: newVehicleModel.vehicleModelId,
            typeComponentId: typeComponent.typeComponentId,
            quantity: newTypeComponentInput.quantity,
            durationMonth: newTypeComponentInput.durationMonth,
            mileageLimit: newTypeComponentInput.mileageLimit,
            transaction,
          });
        }
      }

      return { newVehicleModel };
    });

    return rawResult;
  };
}

export default OemVehicleModelService;
