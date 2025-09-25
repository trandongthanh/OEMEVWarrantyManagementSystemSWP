// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const TaskAssignment = sequelize.define("TaskAssignment", {
//     taskAssignmentId: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV1,
//       primaryKey: true,
//     },
//     technicianId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       field: "technician_id",
//     },
//     guaranteeCaseId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       field: "guarantee_case_id",
//     },
//     assignedAt: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//       allowNull: false,
//       field: "assigned_at",
//     },
//     startedAt: {
//       type: DataTypes.DATE,
//       allowNull: true,
//       field: "started_at",
//     },
//     completedAt: {
//       type: DataTypes.DATE,
//       allowNull: true,
//       field: "completed_at",
//     },
//     isActive: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       field: "is_active",
//     },
//   });

//   TaskAssignment.associate = function (models) {
//     TaskAssignment.belongsTo(models.User, {
//       foreignKey: "technician_id",
//       as: "technician",
//     });
//     TaskAssignment.belongsTo(models.GuaranteeCase, {
//       foreignKey: "guarantee_case_id",
//       as: "guaranteeCase",
//     });
//   };

//   return TaskAssignment;
// };
