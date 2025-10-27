class VehicleProcessingRecordController {
  #vehicleProcessingRecordService;
  #warehouseService;
  #vehicleService;
  constructor({
    vehicleProcessingRecordService,
    warehouseService,
    vehicleService,
  }) {
    this.#vehicleProcessingRecordService = vehicleProcessingRecordService;
    this.#warehouseService = warehouseService;
    this.#vehicleService = vehicleService;
  }

  createRecord = async (req, res) => {
    const { odometer, guaranteeCases, vin, visitorInfo } = req.body;

    const createdByStaffId = req.user.userId;
    const serviceCenterId = req.user.serviceCenterId;

    const { companyId } = req;

    const newRecord = await this.#vehicleProcessingRecordService.createRecord({
      vin: vin,
      odometer: odometer,
      guaranteeCases: guaranteeCases,
      visitorInfo: visitorInfo,
      createdByStaffId: createdByStaffId,
      serviceCenterId: serviceCenterId,
      companyId: companyId,
    });

    res.status(201).json({
      status: "success",
      data: newRecord,
    });
  };

  updateMainTechnician = async (req, res) => {
    const { technicianId } = req.body;
    const { id } = req.params;
    const { serviceCenterId, roleName, userId } = req.user;

    const updatedRecord =
      await this.#vehicleProcessingRecordService.updateMainTechnician({
        vehicleProcessingRecordId: id,
        technicianId: technicianId,
        serviceCenterId: serviceCenterId,
        roleName: roleName,
        userId: userId,
      });

    res.status(200).json({
      status: "success",
      data: updatedRecord,
    });
  };

  getById = async (req, res, next) => {
    const { userId, roleName, serviceCenterId } = req.user;

    const { id } = req.params;

    const record = await this.#vehicleProcessingRecordService.findDetailById({
      id: id,
      userId: userId,
      roleName: roleName,
      serviceCenterId: serviceCenterId,
    });

    if (!record) {
      return res.status(404).json({
        status: "fail",
        message: `Record with id ${id} not found`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        record,
      },
    });
  };

  searchCompatibleComponentsInStock = async (req, res, next) => {
    const { id } = req.params;
    const { userId, serviceCenterId, roleName } = req.user;
    const { searchName, category } = req.query;
    const { companyId } = req;

    const record = await this.#vehicleProcessingRecordService.findDetailById({
      id: id,
      userId: userId,
      roleName: roleName,
      serviceCenterId: serviceCenterId,
    });

    if (!record) {
      return res.status(404).json({
        status: "fail",
        message: `Record with id ${id} not found`,
      });
    }

    const modelId = record?.vehicle?.model?.vehicleModelId;
    const vin = record?.vehicle?.vin;
    const odometer = record?.odometer;

    const components =
      await this.#warehouseService.searchCompatibleComponentsInStock({
        serviceCenterId: serviceCenterId,
        searchName: searchName,
        category: category,
        modelId: modelId,
        vin: vin,
        odometer: odometer,
        companyId: companyId,
      });

    const result = components.map((component) => {
      return {
        typeComponentId: component.typeComponentId,
        name: component.name,
        isUnderWarranty: component.isUnderWarranty || false,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        result,
      },
    });
  };

  getAllRecords = async (req, res, next) => {
    const { roleName, userId, serviceCenterId } = req.user;
    const { page = 1, limit = 10, status } = req.query;

    const records = await this.#vehicleProcessingRecordService.getAllRecords({
      serviceCenterId,
      userId,
      roleName,
      page,
      limit,
      status,
    });

    res.status(200).json({
      status: "success",
      data: {
        records,
      },
    });
  };

  completeRecord = async (req, res, next) => {
    const { id } = req.params;

    const completedRecord =
      await this.#vehicleProcessingRecordService.completeRecord({
        vehicleProcessingRecordId: id,
      });

    if (!completedRecord) {
      return res.status(404).json({
        status: "fail",
        message: `Record with id ${id} not found or cannot be completed`,
      });
    }

    res.status(200).json({
      status: "success",
      data: completedRecord,
    });
  };

  completeDiagnosis = async (req, res, next) => {
    const { id } = req.params;
    const { userId, roleName, serviceCenterId } = req.user;
    const companyId = req.companyId;

    const completedRecord =
      await this.#vehicleProcessingRecordService.makeDiagnosisCompleted({
        vehicleProcessingRecordId: id,
        userId,
        roleName,
        serviceCenterId,
      });

    if (!completedRecord) {
      return res.status(404).json({
        status: "fail",
        message: `Record with id ${id} not found or cannot be completed`,
      });
    }

    res.status(200).json({
      status: "success",
      data: completedRecord,
    });
  };
}
export default VehicleProcessingRecordController;
