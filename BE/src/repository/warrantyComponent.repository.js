import db from "../models/index.cjs";

const { WarrantyComponent, TypeComponent } = db;

class WarrantyComponentRepository {
  findByPk = async (id, transaction = null) => {
    const record = await WarrantyComponent.findByPk(id, { transaction });
    return record ? record.toJSON() : null;
  };

  update = async (id, data, transaction = null) => {
    const [affectedRows] = await WarrantyComponent.update(data, {
      where: { id },
      transaction,
    });

    if (affectedRows === 0) {
      return null;
    }

    return this.findByPk(id, transaction);
  };

  bulkCreate = async (records, transaction = null) => {
     if (!records || records.length === 0) {
      return [];
    }

    const created = await WarrantyComponent.bulkCreate(records, {
      transaction,
      returning: true,
    });

    return created.map((record) => record.toJSON());
  }

  createWarrantyComponent = async ({
    vehicleModelId,
    typeComponentId,
    quantity,
    durationMonth,
    mileageLimit,
    transaction,
  }) => {
    return WarrantyComponent.create(
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

  bulkCreateWarrantyComponents = async ({
    warrantyComponents,
    transaction,
  }) => {
    if (!warrantyComponents || warrantyComponents.length === 0) {
      return [];
    }

    const created = await WarrantyComponent.bulkCreate(warrantyComponents, {
      transaction,
      returning: true,
    });

    return created.map((record) => record.toJSON());
  };

  updateWarrantyComponent = async (
    { warrantyComponentId, updateData },
    transaction = null
  ) => {
    const [affectedRows] = await WarrantyComponent.update(updateData, {
      where: { id: warrantyComponentId },
      transaction,
    });

    if (affectedRows === 0) {
      return null;
    }

    const updatedRecord = await WarrantyComponent.findByPk(warrantyComponentId, {
      transaction,
    });
    return updatedRecord ? updatedRecord.toJSON() : null;
  };

  findByVehicleModelId = async (vehicleModelId, transaction = null) => {
    const records = await WarrantyComponent.findAll({
      where: { vehicleModelId },
      include: [
        {
          model: TypeComponent,
          as: "typeComponent",
          attributes: ["name", "sku", "price", "category"],
        },
      ],
      transaction,
    });
    return records.map((record) => record.toJSON());
  };
}

export default WarrantyComponentRepository;
