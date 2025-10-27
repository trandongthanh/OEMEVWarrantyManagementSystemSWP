class WorkScheduleController {
  constructor({ workScheduleService }) {
    this.workScheduleService = workScheduleService;
  }

  uploadSchedules = async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const managerId = req.user.userId;
    const fileBuffer = req.file.buffer;

    const result = await this.workScheduleService.uploadSchedulesFromExcel({
      fileBuffer,
      managerId,
    });

    res.status(result.success ? 200 : 400).json({
      status: result.success ? "success" : "error",
      message: result.message,
      data: result.data,
    });
  };

  getSchedules = async (req, res, next) => {
    const { serviceCenterId, roleId } = req.user;
    const {
      startDate,
      endDate,
      technicianId,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      startDate,
      endDate,
      technicianId,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (serviceCenterId) {
      filters.serviceCenterId = serviceCenterId;
    }

    const result = await this.workScheduleService.getSchedules(filters);

    res.status(200).json({
      status: "success",
      data: result.schedules,
      pagination: result.pagination,
    });
  };

  getMySchedule = async (req, res, next) => {
    const technicianId = req.user.userId;
    const { startDate, endDate } = req.query;

    const schedules = await this.workScheduleService.getMySchedule({
      technicianId,
      startDate,
      endDate,
    });

    res.status(200).json({
      status: "success",
      data: schedules,
    });
  };

  getAvailableTechnicians = async (req, res, next) => {
    const { workDate } = req.query;
    const { serviceCenterId } = req.user;

    const technicians = await this.workScheduleService.getAvailableTechnicians({
      workDate,
      serviceCenterId,
    });

    res.status(200).json({
      status: "success",
      data: technicians,
    });
  };

  updateSchedule = async (req, res, next) => {
    const { scheduleId } = req.params;
    const managerId = req.user.userId;
    const updateData = req.body;

    const updated = await this.workScheduleService.updateSchedule({
      scheduleId,
      updateData,
      managerId,
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật schedule thành công",
      data: updated,
    });
  };
}

export default WorkScheduleController;
