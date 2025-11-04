const { assign } = require("nodemailer/lib/shared");

module.exports = (sequelize, DataTypes) => {
  const TaskAssignment = sequelize.define(
    "TaskAssignment",
    {
      taskAssignmentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
        field: "guarantee_case_id",
      },

      caseLineId: {
        type: DataTypes.UUID,
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

      assignedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "assigned_by",
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
    TaskAssignment.belongsTo(models.User, {
      foreignKey: "assigned_by",
      as: "assigner",
    });
  };

  return TaskAssignment;
};
