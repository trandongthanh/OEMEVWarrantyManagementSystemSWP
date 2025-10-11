class CaseLineController {
  constructor({ caseLineService }) {
    this.caseLineService = caseLineService;
  }

  createCaseLine = async (req, res, next) => {
    const { caseId } = req.params;
    const { caselines } = req.body;
    const { serviceCenterId, userId } = req.user;

    const newCaseLines = await this.caseLineService.createCaseLines({
      guaranteeCaseId: caseId,
      caselines: caselines,
      serviceCenterId: serviceCenterId,
      techId: userId,
    });

    res.status(201).json({
      status: "success",
      data: {
        caseLines: newCaseLines,
      },
    });
  };
}

export default CaseLineController;
