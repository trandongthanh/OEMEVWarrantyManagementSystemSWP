class VehicleProcessingRecordController {
  constructor({
    vehicleProcessingRecordService,
    warehouseService,
    vehicleService,
  }) {
    this.vehicleProcessingRecordService = vehicleProcessingRecordService;
    this.warehouseService = warehouseService;
    this.vehicleService = vehicleService;
  }

  createRecord = async (req, res) => {
    const { odometer, guaranteeCases, vin } = req.body;

    const createdByStaffId = req.user.userId;

    const { companyId } = req;

    const newRecord = await this.vehicleProcessingRecordService.createRecord({
      odometer: odometer,
      createdByStaffId: createdByStaffId,
      vin: vin,
      guaranteeCases: guaranteeCases,
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

    const updatedRecord =
      await this.vehicleProcessingRecordService.updateMainTechnician({
        vehicleProcessingRecordId: id,
        technicianId,
      });

    res.status(200).json({
      status: "success",
      data: updatedRecord,
    });
  };

  findById = async (req, res, next) => {
    const { userId, roleName, serviceCenterId } = req.user;

    const { id } = req.params;

    const record = await this.vehicleProcessingRecordService.findById({
      id: id,
      userId: userId,
      roleName: roleName,
      serviceCenterId: serviceCenterId,
    });

    res.status(200).json({
      status: "success",
      data: {
        record,
      },
    });
  };

  searchCompatibleComponentsInStock = async (req, res, next) => {
    // try {
    const { id } = req.params;
    const { userId, serviceCenterId, roleName } = req.user;
    const { searchName, category } = req.query;
    const { companyId } = req;

    const record = await this.vehicleProcessingRecordService.findById({
      id: id,
      userId: userId,
      roleName: roleName,
      serviceCenterId: serviceCenterId,
    });

    const modelId = record?.vehicle?.model?.vehicleModelId;
    const vin = record?.vehicle?.vin;
    const odometer = record?.odometer;

    const components =
      await this.warehouseService.searchCompatibleComponentsInStock({
        serviceCenterId: serviceCenterId,
        searchName: searchName,
        category: category,
        modelId: modelId,
      });

    const vehicleWarranty =
      await this.vehicleService.findVehicleByVinWithWarranty({
        odometer: odometer,
        vin: vin,
        companyId: companyId,
      });

    const componentWarrantyIds = vehicleWarranty?.componentWarranties?.map(
      (component) => {
        return {
          typeComponentId: component.typeComponentId,
          duration: component?.duration?.status,
          mileage: component?.mileage?.status,
        };
      }
    );

    const componentsUnderWarranty = [];
    componentWarrantyIds.forEach((component) => {
      if (component.duration === "ACTIVE" && component.mileage === "ACTIVE") {
        componentsUnderWarranty.push(component.typeComponentId);
      }
    });

    for (const component of components) {
      if (componentsUnderWarranty.includes(component.typeComponentId)) {
        component.isUnderWarranty = true;
      }
    }

    const result = components.map((component) => {
      return {
        typeComponentId: component.typeComponentId,
        name: component.name,
        isUnderWarranty: component.isUnderWarranty || false,
        // price: component.price,

        // warehouse: component?.warehouses.map((warehouse) => {
        //   return {
        //     quantityAvailable: warehouse?.Stock?.quantityAvailable,
        //     quantityInStock: warehouse.Stock.quantityInStock,
        //     quantityReserved: warehouse.Stock.quantityReserved,
        //   };
        // }),

        // quantityInStock: component?.warehouses.reduce((total, warehouse) => {
        //   return warehouse?.Stock.quantityInStock + total;
        // }, 0),

        // quantityReserved: component?.warehouses.reduce((total, warehouse) => {
        //   return warehouse?.Stock.quantityReserved + total;
        // }, 0),

        // quantityAvailable: component?.warehouses.reduce((total, warehouse) => {
        //   return warehouse?.Stock.quantityAvailable + total;
        // }, 0),
        // quantityReserved: component.warehouses.Stock.quantityReserved,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        result,
      },
    });
    // } catch (error) {
    //   next(error);
    // }
  };

  getAllRecords = async (req, res, next) => {
    const { roleName, userId, serviceCenterId } = req.user;
    const { page = 1, limit = 10, status } = req.query;

    const records = await this.vehicleProcessingRecordService.getAllRecords({
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

  bulkUpdateStockQuantities = async (req, res, next) => {
    const { caseId } = req.params;
    const { caselines } = req.body;
    const { serviceCenterId, userId } = req.user;

    const updatedStocks =
      await this.vehicleProcessingRecordService.bulkUpdateStockQuantities({
        caseId: caseId,
        caselines: caselines,
        serviceCenterId: serviceCenterId,
        userId: userId,
      });

    res.status(200).json({
      status: "success",
      data: {
        updatedStocks,
      },
    });
  };
}
export default VehicleProcessingRecordController;
