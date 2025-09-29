// module.exports = (sequelize, DataTypes) => {
//   const InstalledPart = sequelize.define(
//     "InstalledPart",
//     {
//       installedPartId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "installed_part_id",
//       },
//       technicianId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "technician_id",
//       },
//       guaranteeCaseId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "guarantee_case_id",
//       },
//       oldComponentId: {
//         type: DataTypes.UUID,
//         field: "old_component_id",
//       },
//       newComponentId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "new_component_id",
//       },
//       status: {
//         type: DataTypes.BOOLEAN,
//         allowNull: false,
//         field: "status",
//       },
//     },
//     {
//       tableName: "installed_part",
//     }
//   );

//   InstalledPart.associate = function (models) {
//     InstalledPart.belongsTo(models.GuaranteeCase, {
//       foreignKey: "guarantee_case_id",
//       as: "guaranteeCase",
//     });
//     InstalledPart.belongsTo(models.User, {
//       foreignKey: "technician_id",
//       as: "technician",
//     });
//     InstalledPart.belongsTo(models.Component, {
//       foreignKey: "old_component_id",
//       as: "oldComponent",
//     });
//     InstalledPart.belongsTo(models.Component, {
//       foreignKey: "new_component_id",
//       as: "newComponent",
//     });
//   };

//   return InstalledPart;
// };
