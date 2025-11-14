class OemVehicleModelController {
  #oemVehicleModelService;
  constructor({ oemVehicleModelService }) {
    this.#oemVehicleModelService = oemVehicleModelService;
  }

  createVehicleModel = async (req, res) => {
    const {
      vehicleModelName,
      yearOfLaunch,
      placeOfManufacture,
      generalWarrantyDuration,
      generalWarrantyMileage,
      components,
    } = req.body;

    const { companyId } = req;

    const result = await this.#oemVehicleModelService.createVehicleModel({
      vehicleModelName,
      yearOfLaunch,
      placeOfManufacture,
      generalWarrantyDuration,
      generalWarrantyMileage,
      components,
      companyId,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  };

  createWarrantyComponentsForModel = async (req, res) => {
    const { vehicleModelId } = req.params;
    const { typeComponentWarrantyList } = req.body;

    const result =
      await this.#oemVehicleModelService.createWarrantyComponentsForModel({
        vehicleModelId,
        typeComponentWarrantyList,
      });

    res.status(201).json({
      status: "success",
      data: result,
    });
  };

  updateWarrantyComponent = async (req, res, next) => {
    const { warrantyComponentId } = req.params;
    const updateData = req.body;

    const updatedRecord =
      await this.#oemVehicleModelService.updateWarrantyComponent({
        warrantyComponentId,
        updateData,
      });

    res.status(200).json({
      status: "success",
      data: updatedRecord,
    });
  };

  getWarrantyComponentsForModel = async (req, res, next) => {
    const { vehicleModelId } = req.params;

    const warrantyComponents =
      await this.#oemVehicleModelService.getWarrantyComponentsForModel({
        vehicleModelId,
      });

    res.status(200).json({
      status: "success",
      data: warrantyComponents,
    });
  };

  getAllModelsWithWarranty = async (req, res, next) => {
    const models = await this.#oemVehicleModelService.getAllModelsWithWarranty();

    res.status(200).json({
      status: "success",
      data: models,
    });
  };
}
export default OemVehicleModelController;
