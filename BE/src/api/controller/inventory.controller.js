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

  getComponentUploadTemplate = async (req, res, next) => {
    try {
      const buffer = await this.#inventoryService.getComponentUploadTemplate();
      const fileName = "component_upload_template.xlsx";

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  uploadInventoryFromExcel = async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const { userId } = req.user;

    const { adjustmentType, reason, note, warehouseId } = req.body;

    if (!warehouseId) {
      return res.status(400).json({
        status: "error",
        message: "Warehouse ID is required",
      });
    }

    if (adjustmentType !== "IN") {
      return res.status(400).json({
        status: "error",
        message: "Excel upload only supports adjustment type 'IN'",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Reason is required",
      });
    }

    const fileBuffer = req.file.buffer;

    const result = await this.#inventoryService.uploadInventoryFromExcel({
      fileBuffer,
      adjustedByUserId: userId,
      warehouseId,
      adjustmentType,
      reason,
      note,
    });

    res.status(result.success ? 200 : 400).json({
      status: result.success ? "success" : "error",
      message: result.message,
      data: result.data,
    });
  };
}

export default InventoryController;
