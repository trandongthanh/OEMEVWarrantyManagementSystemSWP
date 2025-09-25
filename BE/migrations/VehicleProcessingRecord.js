// module.exports = (sequelize, DataTypes) => {
//   const VehicleProcessingRecord = sequelize.define(
//     "VehicleProcessingRecord",
//     {
//       vehicleProcessingRecordId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "vehicle_processing_record_id",
//       },
//       checkInDate: {
//         type: DataTypes.UUID,
//         field: "check_in_date",
//       },
//       odometer: {
//         type: DataTypes.FLOAT,
//         field: "odometer",
//       },
//       status: {
//         type: DataTypes.BOOLEAN,
//         field: "status",
//       },
//       createdByStaffId: {
//         type: DataTypes.UUID,
//         field: "created_by_staff_id",
//       },
//       vehcielId: {
//         type: DataTypes.UUID,
//         field: "vehicle_id",
//       },
//     },
//     {
//       tableName: "vehicle_processing_record",
//     }
//   );

//   VehicleProcessingRecord.associate = function (models) {
//     VehicleProcessingRecord.belongsTo(models.User, {
//       foreignKey: "created_by_staff_id",
//       as: "createdByStaff",
//     });

//     VehicleProcessingRecord.belongsTo(models.Vehicle, {
//       foreignKey: "vehicle_id",
//       as: "vehicle",
//     });

//     VehicleProcessingRecord.hasMany(models.GuaranteeCase, {
//       foreignKey: "vehicle_processing_record_id",
//       as: "guaranteeCases",
//     });
//   };

//   return VehicleProcessingRecord;
// };
