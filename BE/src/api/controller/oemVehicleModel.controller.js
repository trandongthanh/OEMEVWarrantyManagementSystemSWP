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
}
export default OemVehicleModelController;
