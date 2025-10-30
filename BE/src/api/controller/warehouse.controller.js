class WarehouseController {
  #warehouseService;

  constructor({ warehouseService }) {
    this.#warehouseService = warehouseService;
  }

  async getAllWarehouse(req, res, next) {
    const { serviceCenterId } = req.user;

    const warehouses = await this.#warehouseService.getAllWarehouses(
      serviceCenterId
    );

    res.status(200).json({
      status: "success",
      data: {
        warehouses,
      },
    });
  }
}

export default WarehouseController;
