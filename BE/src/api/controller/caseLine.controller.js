class CaseLineController {
  constructor({ caseLineService }) {
    this.caseLineService = caseLineService;
  }

  createCaseLine = async (req, res, next) => {
    const { caseId } = req.params;
    const { caselines } = req.body;
    const { serviceCenterId, userId } = req.user;
    const { companyId } = req;

    const newCaseLines = await this.caseLineService.createCaseLines({
      guaranteeCaseId: caseId,
      caselines: caselines,
      serviceCenterId: serviceCenterId,
      techId: userId,
      companyId: companyId,
    });

    res.status(201).json({
      status: "success",
      data: {
        caseLines: newCaseLines,
      },
    });
  };

  assignTechnician = async (req, res, next) => {
    const { caselineId } = req.params;
    const { technicianId } = req.body;
    const { serviceCenterId } = req.user;

    const result = await this.caseLineService.assignTechnicianToCaseline({
      caselineId,
      technicianId,
      serviceCenterId,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  allocateStockForCaseline = async (req, res, next) => {
    const { caselineId } = req.params;

    const result = await this.caseLineService.allocateStockForCaseline({
      caselineId,
    });

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "No available stock found for allocation",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Stock allocated successfully",
      data: result,
    });
  };
}

export default CaseLineController;
