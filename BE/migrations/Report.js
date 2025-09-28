// module.exports = (sequelize, DataTypes) => {
//   const Report = sequelize.define(
//     "Report",
//     {
//       reportId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "report_id",
//       },
//       diagnosis: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         field: "diagnosis",
//       },
//       image: {
//         type: DataTypes.TEXT,
//         field: "image",
//       },
//       guaranteeCaseId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "guarantee_case_id",
//       },
//       technicianId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "technician_id",
//       },
//       seriNumberComponent: {
//         type: DataTypes.UUID,
//         allowNull: true,
//         field: "seri_number",
//       },
//       quantity: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         field: "quantity",
//       },
//     },
//     {
//       tableName: "report",
//     }
//   );

//   Report.associate = function (models) {
//     Report.belongsTo(models.GuaranteeCase, {
//       foreignKey: "guarantee_case_id",
//       as: "guaranteeCase",
//     });
//     Report.belongsTo(models.User, {
//       foreignKey: "technician_id",
//       as: "owner",
//     });
//     Report.belongsTo(models.Component, {
//       foreignKey: "seri_number",
//     });
//   };

//   return Report;
// };
