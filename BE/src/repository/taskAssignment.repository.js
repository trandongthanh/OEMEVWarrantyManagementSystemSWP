import db from "../models/index.cjs";

const { TaskAssignment } = db;

class TaskAssignmentRepository {
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
}

export default TaskAssignmentRepository;
