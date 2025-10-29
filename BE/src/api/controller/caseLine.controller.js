class CaseLineController {
  #caseLineService;
  constructor({ caseLineService }) {
    this.#caseLineService = caseLineService;
  }

  createCaseLines = async (req, res, next) => {
    const { caseId } = req.params;
    const { caselines } = req.body;
    const { serviceCenterId, userId, roleName } = req.user;
    const { companyId } = req;

    const newCaseLines = await this.#caseLineService.createCaseLines({
      guaranteeCaseId: caseId,
      caselines: caselines,
      serviceCenterId: serviceCenterId,
      roleName: roleName,
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

  createCaseLine = async (req, res, next) => {
    const { caseId } = req.params;
    const {
      diagnosisText,
      correctionText,
      typeComponentId,
      quantity,
      warrantyStatus,
    } = req.body;

    const { serviceCenterId, userId } = req.user;
    const { companyId } = req;

    const newCaseLine = await this.#caseLineService.createCaseLine({
      guaranteeCaseId: caseId,
      typeComponentId,
      quantity,
      diagnosisText,
      correctionText,
      warrantyStatus,
      serviceCenterId: serviceCenterId,
      techId: userId,
      companyId: companyId,
    });

    res.status(201).json({
      status: "success",
      data: {
        caseLine: newCaseLine,
      },
    });
  };

  assignTechnicianToRepairCaseline = async (req, res, next) => {
    const { caselineId } = req.params;
    const { technicianId } = req.body;
    const { serviceCenterId } = req.user;

    const result = await this.#caseLineService.assignTechnicianToRepairCaseline(
      {
        caselineId,
        technicianId,
        serviceCenterId,
      }
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  approveCaseline = async (req, res, next) => {
    const { approvedCaseLineIds, rejectedCaseLineIds } = req.body;
    const { serviceCenterId } = req.user;
    const result = await this.#caseLineService.approveCaseline({
      approvedCaseLineIds,
      rejectedCaseLineIds,
      serviceCenterId,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  allocateStockForCaseline = async (req, res, next) => {
    const { caseId, caselineId } = req.params;

    const { userId } = req.user;

    const result = await this.#caseLineService.allocateStockForCaseline({
      caseId,
      caselineId,
      userId,
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

  updateCaseLine = async (req, res, next) => {
    const { caseId, caselineId } = req.params;

    const {
      diagnosisText,
      correctionText,
      typeComponentId,
      quantity,
      warrantyStatus,
      rejectionReason,
    } = req.body;

    const { serviceCenterId } = req.user;
    const { companyId } = req;

    const updatedCaseLine = await this.#caseLineService.updateCaseLine({
      guaranteeCaseId: caseId,
      caselineId,
      diagnosisText,
      correctionText,
      typeComponentId,
      quantity,
      warrantyStatus,
      rejectionReason,
      serviceCenterId,
      companyId,
      userId,
    });

    res.status(200).json({
      status: "success",
      data: {
        caseLine: updatedCaseLine,
      },
    });
  };

  getCaseLines = async (req, res, next) => {
    const {
      page,
      limit,
      status,
      guaranteeCaseId,
      warrantyStatus,
      vehicleProcessingRecordId,
      diagnosticTechId,
      repairTechId,
      sortBy,
      sortOrder,
    } = req.query;

    const { serviceCenterId } = req.user;

    const result = await this.#caseLineService.getCaseLines({
      page,
      limit,
      status,
      guaranteeCaseId,
      warrantyStatus,
      vehicleProcessingRecordId,
      diagnosticTechId,
      repairTechId,
      sortBy,
      sortOrder,
      serviceCenterId,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  getCaseLineById = async (req, res, next) => {
    const { caselineId } = req.params;

    const { userId, roleName } = req.user;

    const caseLine = await this.#caseLineService.getCaseLineById(
      userId,
      roleName,
      caselineId
    );

    if (!caseLine) {
      return res.status(404).json({
        status: "error",
        message: "Case line not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        caseLine,
      },
    });
  };

  markRepairCompleted = async (req, res, next) => {
    const { caselineId } = req.params;

    const { userId, roleName, serviceCenterId } = req.user;

    const result = await this.#caseLineService.markRepairCompleted(
      caselineId,
      userId,
      roleName,
      serviceCenterId
    );

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Caseline not found or already completed",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Repair marked as completed successfully",
      data: result,
    });
  };
}

export default CaseLineController;
