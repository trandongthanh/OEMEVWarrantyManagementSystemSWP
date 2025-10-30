class InventoryController {
  #inventoryService;
  constructor({ inventoryService }) {
    this.#inventoryService = inventoryService;
  }

  getInventorySummary = async (req, res, next) => {
    const { serviceCenterId, roleName } = req.user;
    const { companyId } = req;
    const { serviceCenterId: filterServiceCenterId } = req.query;

    const summary = await this.#inventoryService.getInventorySummary({
      serviceCenterId,
      roleName,
      companyId,
      filters: {
        serviceCenterId: filterServiceCenterId,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        summary,
      },
    });
  };

  getInventoryTypeComponents = async (req, res, next) => {
    const { serviceCenterId, roleName } = req.user;

    const { companyId } = req;

    const {
      page,
      limit,
      typeComponentId,
      serviceCenterId: filterServiceCenterId,
    } = req.query;

    const components = await this.#inventoryService.getInventoryTypeComponents({
      serviceCenterId,
      roleName,
      companyId,
      filters: {
        serviceCenterId: filterServiceCenterId,
        typeComponentId,
        page,
        limit,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        components,
      },
    });
  };

  createInventoryAdjustment = async (req, res, next) => {
    const { userId: adjustedByUserId, roleName } = req.user;
    const { companyId } = req;
    const { stockId, adjustmentType, quantity, reason, note } = req.body;

    const result = await this.#inventoryService.createInventoryAdjustment({
      stockId,
      adjustmentType,
      quantity,
      reason,
      note,
      adjustedByUserId,
      roleName,
      companyId,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  };
}

export default InventoryController;
