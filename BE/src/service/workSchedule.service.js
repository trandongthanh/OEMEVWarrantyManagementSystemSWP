import XLSX from "xlsx";
import dayjs from "dayjs";
import db from "../models/index.cjs";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../error/index.js";

class WorkScheduleService {
  constructor({ workScheduleRepository, userRepository }) {
    this.workScheduleRepository = workScheduleRepository;
    this.userRepository = userRepository;
  }

  async parseExcelFile(fileBuffer, managerId) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rawData = XLSX.utils.sheet_to_json(worksheet);

      if (!rawData || rawData.length === 0) {
        throw new BadRequestError("File empty or contains no data");
      }

      const validRecords = [];
      const errors = [];

      const manager = await this.userRepository.findUserById({
        userId: managerId,
      });

      if (!manager || !manager.serviceCenterId) {
        throw new ForbiddenError(
          "Manager does not belong to any service center"
        );
      }

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2;

        try {
          const technicianId =
            row["Technician ID"] || row["technicianId"] || row["TechnicianID"];
          const workDate = row["Date"] || row["WorkDate"] || row["workDate"];
          const status = row["Status"] || row["status"];

          if (!technicianId) {
            errors.push({
              row: rowNumber,
              field: "Technician ID",
              error: "Thiếu Technician ID",
            });
            continue;
          }

          if (!workDate) {
            errors.push({
              row: rowNumber,
              field: "Date",
              error: "Thiếu ngày làm việc",
            });
            continue;
          }

          if (!status) {
            errors.push({
              row: rowNumber,
              field: "Status",
              error: "Thiếu trạng thái",
            });
            continue;
          }

          const validStatuses = ["AVAILABLE", "UNAVAILABLE"];
          const normalizedStatus = status.toString().toUpperCase().trim();

          if (!validStatuses.includes(normalizedStatus)) {
            errors.push({
              row: rowNumber,
              field: "Status",
              error: "Status is not valid",
            });
            continue;
          }

          let formattedDate;
          try {
            if (typeof workDate === "number") {
              const excelDate = XLSX.SSF.parse_date_code(workDate);
              formattedDate = dayjs(
                `${excelDate.y}-${excelDate.m}-${excelDate.d}`
              ).format("YYYY-MM-DD");
            } else {
              formattedDate = dayjs(workDate).format("YYYY-MM-DD");
            }

            if (!dayjs(formattedDate).isValid()) {
              throw new Error("Invalid date");
            }
          } catch (err) {
            errors.push({
              row: rowNumber,
              field: "Date",
              error: "Format workdate is not valid",
            });
            continue;
          }

          const technician = await this.userRepository.findUserById({
            userId: technicianId,
          });

          if (!technician) {
            errors.push({
              row: rowNumber,
              field: "Technician ID",
              error: `Technician ID "${technicianId}" is not found`,
            });
            continue;
          }

          if (technician.serviceCenterId !== manager.serviceCenterId) {
            errors.push({
              row: rowNumber,
              field: "Technician ID",
              error: `Technician does not belong to your service center`,
            });
            continue;
          }

          const notes = row["Notes"] || row["notes"] || null;

          validRecords.push({
            technicianId: technicianId.trim(),
            technicianName: technician.name,
            workDate: formattedDate,
            status: normalizedStatus,
            notes: notes ? notes.toString().trim() : null,
          });
        } catch (error) {
          errors.push({
            row: rowNumber,
            error: error.message || "Lỗi không xác định",
          });
        }
      }

      return {
        validRecords,
        errors,
        totalRows: rawData.length,
        validCount: validRecords.length,
        errorCount: errors.length,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Lỗi khi parse file Excel: ${error.message}`, 400);
    }
  }

  async uploadSchedulesFromExcel({ fileBuffer, managerId }) {
    const parseResult = await this.parseExcelFile(fileBuffer, managerId);

    if (parseResult.errorCount > 0) {
      return {
        success: false,
        message: "File có lỗi, vui lòng kiểm tra lại",
        data: parseResult,
      };
    }

    if (parseResult.validCount === 0) {
      throw new AppError("Không có dữ liệu hợp lệ để import", 400);
    }

    const transaction = await db.sequelize.transaction();

    const result = await this.workScheduleRepository.bulkUpsertSchedules(
      parseResult.validRecords,
      transaction
    );

    await transaction.commit();

    return {
      data: {
        totalProcessed: parseResult.validCount,
        created: result.created,
        updated: result.updated,
        summary: parseResult,
      },
    };
  }

  async getSchedules(filters) {
    return await this.workScheduleRepository.findSchedules(filters);
  }

  async getMySchedule({ technicianId, startDate, endDate }) {
    return await this.workScheduleRepository.findSchedulesByTechnician({
      technicianId,
      startDate,
      endDate,
    });
  }

  async getAvailableTechnicians({ workDate, serviceCenterId }) {
    if (!workDate) {
      throw new BadRequestError("workDate is required");
    }

    return await this.workScheduleRepository.findAvailableTechnicians({
      workDate,
      serviceCenterId,
    });
  }

  async updateSchedule({ scheduleId, updateData, managerId }) {
    const schedule = await this.workScheduleRepository.findScheduleById(
      scheduleId
    );

    if (!schedule) {
      throw new NotFoundError("Schedule is not found");
    }

    const manager = await this.userRepository.findUserById({
      userId: managerId,
    });
    const technician = await this.userRepository.findUserById({
      userId: schedule.technicianId,
    });

    if (manager.serviceCenterId !== technician.serviceCenterId) {
      throw new ForbiddenError(
        "You do not have permission to update this schedule"
      );
    }

    if (updateData.status) {
      const validStatuses = ["AVAILABLE", "UNAVAILABLE"];
      if (!validStatuses.includes(updateData.status)) {
        throw new BadRequestError("Status is not valid");
      }
    }

    return await this.workScheduleRepository.updateSchedule(
      scheduleId,
      updateData
    );
  }
}

export default WorkScheduleService;
