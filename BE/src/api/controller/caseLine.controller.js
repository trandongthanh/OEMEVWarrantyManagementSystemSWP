class CaselineController {
  constructor({ caseLineService }) {
    this.caseLineService = caseLineService;
  }

  createCaseLine = async (req, res, next) => {
    const { caseId } = req.params;
    const { caselines } = req.body;
    const { serviceCenterId, userId } = req.user;

    const newCaseLines = await this.caseLineService.createCaseLine({
      guaranteeCaseId: caseId,
      caselines: caselines,
      serviceCenterId: serviceCenterId,
      techId: userId,
    });
  };
}

export default CaselineController;
