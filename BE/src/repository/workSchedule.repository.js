import db from "../models/index.cjs";
import { Op } from "sequelize";
const { WorkSchedule, User, Role } = db;

class WorkScheduleRepository {
  async upsertSchedule(scheduleData, transaction = null) {
    const [schedule, created] = await WorkSchedule.upsert(
      {
        technicianId: scheduleData.technicianId,
        workDate: scheduleData.workDate,
        status: scheduleData.status,
        notes: scheduleData.notes || null,
      },
      {
        transaction,
      }
    );

    const foundSchedule = await WorkSchedule.findOne({
      where: {
        technicianId: scheduleData.technicianId,
        workDate: scheduleData.workDate,
      },
      transaction,
    });

    return { schedule: foundSchedule ? foundSchedule.toJSON() : null, created };
  }

  async bulkUpsertSchedules(schedulesData, transaction = null) {
    const results = {
      created: 0,
      updated: 0,
      schedules: [],
    };

    for (const data of schedulesData) {
      const { schedule, created } = await this.upsertSchedule(
        data,
        transaction
      );

      if (created) {
        results.created++;
      } else {
        results.updated++;
      }

      results.schedules.push(schedule);
    }

    return results;
  }

  async findSchedules({
    startDate,
    endDate,
    technicianId,
    status,
    serviceCenterId,
    page = 1,
    limit = 10,
  }) {
    const whereCondition = {};
    const userWhereCondition = {};

    if (startDate || endDate) {
      whereCondition.workDate = {};
      if (startDate) whereCondition.workDate[Op.gte] = startDate;
      if (endDate) whereCondition.workDate[Op.lte] = endDate;
    }

    if (technicianId) {
      whereCondition.technicianId = technicianId;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (serviceCenterId) {
      userWhereCondition.serviceCenterId = serviceCenterId;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await WorkSchedule.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "technician",
          attributes: ["userId", "name", "email", "serviceCenterId"],
          where: userWhereCondition,
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["roleName"],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [["workDate", "ASC"]],
    });

    return {
      schedules: rows.map((row) => row.toJSON()),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findSchedulesByTechnician({
    technicianId,
    startDate,
    endDate,
    status,
  }) {
    const whereCondition = { technicianId };

    if (startDate || endDate) {
      whereCondition.workDate = {};
      if (startDate) whereCondition.workDate[Op.gte] = startDate;
      if (endDate) whereCondition.workDate[Op.lte] = endDate;
    }

    if (status) {
      whereCondition.status = status;
    }

    const schedules = await WorkSchedule.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "technician",
          attributes: ["userId", "name", "email"],
        },
      ],
      order: [["workDate", "ASC"]],
    });

    return schedules.map((schedule) => schedule.toJSON());
  }

  async findAvailableTechnicians({ workDate, serviceCenterId }) {
    const whereCondition = {
      workDate,
      status: "AVAILABLE",
    };

    const userWhereCondition = {};
    if (serviceCenterId) {
      userWhereCondition.serviceCenterId = serviceCenterId;
    }

    const schedules = await WorkSchedule.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "technician",
          where: userWhereCondition,
          attributes: ["userId", "name", "email", "serviceCenterId"],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["roleName"],
            },
          ],
        },
      ],
    });

    return schedules.map((schedule) => schedule.toJSON());
  }

  async findScheduleById(scheduleId) {
    const schedule = await WorkSchedule.findOne({
      where: { scheduleId },
      include: [
        {
          model: User,
          as: "technician",
          attributes: ["userId", "name", "email", "serviceCenterId"],
        },
      ],
    });

    return schedule ? schedule.toJSON() : null;
  }

  async updateSchedule(scheduleId, updateData, transaction = null) {
    const [updatedCount] = await WorkSchedule.update(updateData, {
      where: { scheduleId },
      transaction,
    });

    if (updatedCount === 0) {
      return null;
    }

    return await this.findScheduleById(scheduleId);
  }

  async deleteSchedule(scheduleId, transaction = null) {
    const deletedCount = await WorkSchedule.destroy({
      where: { scheduleId },
      transaction,
    });

    return deletedCount > 0;
  }

  async scheduleExists({ technicianId, workDate }) {
    const schedule = await WorkSchedule.findOne({
      where: { technicianId, workDate },
    });

    return schedule !== null;
  }
}

export default WorkScheduleRepository;
