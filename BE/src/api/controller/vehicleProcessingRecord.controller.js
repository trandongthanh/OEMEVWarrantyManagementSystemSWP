class VehicleProcessingRecordController {
  constructor({ vehicleProcessingRecordService, warehouseService }) {
    this.vehicleProcessingRecordService = vehicleProcessingRecordService;
    this.warehouseService = warehouseService;
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
    const { userId } = req.user;

    const { id } = req.params;

    const record = await this.vehicleProcessingRecordService.findById({
      id: id,
      userId: userId,
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
    const { userId, serviceCenterId } = req.user;
    const { searchName, category } = req.query;

    const record = await this.vehicleProcessingRecordService.findById({
      id: id,
      userId: userId,
    });

    const modelId = record?.vehicle?.model?.vehicleModelId;

    const components =
      await this.warehouseService.searchCompatibleComponentsInStock({
        serviceCenterId,
        searchName,
        category,
        modelId,
      });

    const result = components.map((component) => {
      return {
        typeComponentId: component.typeComponentId,
        name: component.name,
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
}
export default VehicleProcessingRecordController;
