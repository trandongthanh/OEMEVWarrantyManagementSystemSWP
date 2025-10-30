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
}

export default InventoryController;
