// const { Sequelize, DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const StatusForGuaranteeCase = sequelize.define("StatusForGuaranteeCase", {
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV1,
//       primaryKey: true,
//       field: "id",
//     },
//     status: {
//       type: DataTypes.ENUM(
//         "in_progress",
//         "sent",
//         "approved",
//         "installing",
//         "completed",
//         "canceled"
//       ),
//       defaultValue: "in_progress",
//       field: "status",
//     },
//     dateOfStatusChange: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       field: "date_of_status_change",
//     },
//     guaranteeCaseId: {
//       type: DataTypes.UUID,
//       field: "guarantee_case_id",
//     },
//   });

//   StatusForGuaranteeCase.associate = function (models) {
//     StatusForGuaranteeCase.belongsTo(models.GuaranteeCase, {
//       foreignKey: "guarantee_case_id",
//       as: "guaranteeCase",
//     });
//   };

//   return StatusForGuaranteeCase;
// };
