import db from "../models/index.cjs";

const { TaskAssignment, User } = db;

class TaskAssignmentRepository {
  findByGuaranteeCaseIds = async (
    { guaranteeCaseIds },
    transaction = null,
    lock = null
  ) => {
    const taskAssignments = await TaskAssignment.findAll({
      where: {
        guaranteeCaseId: guaranteeCaseIds,
        taskType: "DIAGNOSIS",
      },
      transaction,
      lock,
    });

    return taskAssignments.map((ta) => ta.toJSON());
  };

  cancelAssignmentsByGuaranteeCaseIds = async (
    { guaranteeCaseIds },
    transaction
  ) => {
    const whereClause = {
      guaranteeCaseId: guaranteeCaseIds,
      taskType: "DIAGNOSIS",
      isActive: true,
    };

    const [affectedRows] = await TaskAssignment.update(
      { isActive: false },
      {
        where: whereClause,
        transaction,
      }
    );

    return affectedRows;
  };

  bulkCreateTaskAssignments = async (
    { guaranteeCaseIds, technicianId },
    transaction
  ) => {
    const taskAssignmentToCreate = guaranteeCaseIds.map((guaranteeCaseId) => ({
      guaranteeCaseId,
      taskType: "DIAGNOSIS",
      technicianId,
    }));

    const newTaskAssignments = await TaskAssignment.bulkCreate(
      taskAssignmentToCreate,
      {
        transaction,
      }
    );

    if (!newTaskAssignments) {
      return null;
    }

    return newTaskAssignments;
  };

  createTaskAssignmentForCaseline = async (
    { caseLineId, technicianId, taskType = "REPAIR" },
    transaction
  ) => {
    const newTaskAssignment = await TaskAssignment.create(
      {
        caseLineId,
        technicianId,
        taskType,
      },
      { transaction }
    );

    if (!newTaskAssignment) {
      return null;
    }

    return newTaskAssignment.toJSON();
  };

  findByCaselineId = async (caseLineId, transaction = null, lock = null) => {
    const taskAssignment = await TaskAssignment.findOne({
      where: { caseLineId },
      transaction,
      lock,
    });

    if (!taskAssignment) {
      return null;
    }

    return taskAssignment.toJSON();
  };
}

export default TaskAssignmentRepository;
