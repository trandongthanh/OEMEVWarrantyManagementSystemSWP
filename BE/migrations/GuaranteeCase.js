// module.exports = (sequelize, DataTypes) => {
//   const GuaranteeCase = sequelize.define(
//     "GuaranteeCase",
//     {
//       guaranteeCaseId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "guarantee_case_id",
//       },
//       process: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         field: "process",
//       },
//       contentGuarantee: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         field: "content_guarantee",
//       },
//       vehicleProcessingRecordId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "vehicle_processing_record_id",
//       },
//     },
//     {
//       tableName: "guarantee_case",
//     }
//   );

//   GuaranteeCase.associate = function (models) {
//     GuaranteeCase.belongsTo(models.VehicleProcessingRecord, {
//       foreignKey: "vehicle_processing_record_id",
//       as: "vehicleProcessingRecord",
//     });

//     GuaranteeCase.hasMany(models.PartShipment, {
//       foreignKey: "guarantee_case_id",
//       as: "partShipMents",
//     });

//     GuaranteeCase.hasMany(models.InstalledPart, {
//       foreignKey: "guarantee_case_id",
//       as: "installedParts",
//     });

//     GuaranteeCase.hasMany(models.Report, {
//       foreignKey: "guarantee_case_id",
//       as: "reports",
//     });

//     GuaranteeCase.hasMany(models.TaskAssignment, {
//       foreignKey: "guarantee_case_id",
//       as: "taskAssgnments",
//     });

//     GuaranteeCase.hasMany(models.StatusForGuaranteeCase, {
//       foreignKey: "guarantee_case_id",
//       as: "status",
//     });
//   };

//   return GuaranteeCase;
// };
