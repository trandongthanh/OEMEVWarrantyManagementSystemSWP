class WarehouseController {
  #warehouseService;

  constructor({ warehouseService }) {
    this.#warehouseService = warehouseService;
  }

  async getAllWarehouse(req, res, next) {
    const { roleName, serviceCenterId } = req.user;
    const { companyId } = req;
    const { serviceCenterId: filterServiceCenterId } = req.query;

    const warehouses = await this.#warehouseService.getAllWarehouses({
      roleName,
      serviceCenterId,
      companyId,
      filters: {
        serviceCenterId: filterServiceCenterId,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        warehouses,
      },
    });
  }
}

export default WarehouseController;
