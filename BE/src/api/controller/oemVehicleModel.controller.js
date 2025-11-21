class OemVehicleModelController {
  #oemVehicleModelService;

  constructor({ oemVehicleModelService }) {
    this.#oemVehicleModelService = oemVehicleModelService;
  }

  createVehicleModel = async (req, res, next) => {
    const vehicleModelData = req.body;
    const newVehicleModel =
      await this.#oemVehicleModelService.createVehicleModel(vehicleModelData);
    res.status(201).json({
      status: "success",
      data: newVehicleModel,
    });
  };

  getAllModelsWithWarranty = async (req, res, next) => {
    const { limit, page } = req.query;

    const models = await this.#oemVehicleModelService.getAllModelsWithWarranty({
      limit,
      page,
    });
    res.status(200).json({
      status: "success",
      data: models,
    });
  };

  getWarrantyComponentsForModel = async (req, res, next) => {
    const { vehicleModelId } = req.params;
    const components =
      await this.#oemVehicleModelService.getWarrantyComponentsForModel({
        vehicleModelId,
      });
    res.status(200).json({
      status: "success",
      data: components,
    });
  };

  createWarrantyComponentsForModel = async (req, res, next) => {
    const { vehicleModelId } = req.params;
    const { typeComponentWarrantyList } = req.body;

    const newComponents =
      await this.#oemVehicleModelService.createWarrantyComponentsForModel({
        vehicleModelId,
        typeComponentWarrantyList,
      });

    res.status(201).json({
      status: "success",
      data: newComponents,
    });
  };

  updateWarrantyComponent = async (req, res, next) => {
    const { vehicleModelId, warrantyComponentId } = req.params;
    const updateData = req.body;

    const updatedComponent =
      await this.#oemVehicleModelService.updateWarrantyComponent({
        vehicleModelId,
        warrantyComponentId,
        updateData,
      });

    res.status(200).json({
      status: "success",
      data: updatedComponent,
    });
  };
}

export default OemVehicleModelController;
