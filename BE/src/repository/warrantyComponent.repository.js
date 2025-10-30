import db from "../models/index.cjs";

class WarrantyComponentRepository {
  createWarrantyComponent = async ({
    vehicleModelId,
    typeComponentId,
    quantity,
    durationMonth,
    mileageLimit,
    transaction,
  }) => {
    return db.WarrantyComponent.create(
      {
        vehicleModelId,
        typeComponentId,
        quantity,
        durationMonth,
        mileageLimit,
      },
      { transaction }
    );
  };
}

export default WarrantyComponentRepository;
