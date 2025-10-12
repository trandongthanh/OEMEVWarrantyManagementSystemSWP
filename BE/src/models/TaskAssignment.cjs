module.exports = (sequelize, DataTypes) => {
  const TaskAssignment = sequelize.define(
    "TaskAssignment",
    {
      taskAssignmentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        field: "task_assignment_id",
      },

      technicianId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "technician_id",
      },

      guaranteeCaseId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "guarantee_case_id",
      },

      caseLineId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "case_line_id",
      },

      assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: "assigned_at",
      },

      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "completed_at",
      },

      taskType: {
        type: DataTypes.ENUM("DIAGNOSIS", "REPAIR"),
        allowNull: false,
        field: "task_type",
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "task_assignment",
    }
  );

  TaskAssignment.associate = function (models) {
    TaskAssignment.belongsTo(models.User, {
      foreignKey: "technician_id",
      as: "technician",
    });
    TaskAssignment.belongsTo(models.CaseLine, {
      foreignKey: "case_line_id",
      as: "caseLine",
    });
    TaskAssignment.belongsTo(models.GuaranteeCase, {
      foreignKey: "guarantee_case_id",
      as: "guaranteeCase",
    });
  };

  return TaskAssignment;
};
