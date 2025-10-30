class OemVehicleModelController {
  #oemVehicleModelService;
  constructor(oemVehicleModelService) {
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

    const newVehicleModel =
      await this.#oemVehicleModelService.createVehicleModel({
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
      data: newVehicleModel,
    });
  };
}
export default OemVehicleModelController;
