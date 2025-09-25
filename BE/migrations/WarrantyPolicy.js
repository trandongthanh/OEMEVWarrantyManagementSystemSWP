// module.exports = (sequelize, DataTypes) => {
//   const WarrantyPolicy = sequelize.define(
//     "WarrantyPolicy",
//     {
//       warrantyPolicyId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "warranty_policy_id",
//       },

//       name: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         field: "name",
//       },

//       durationMonth: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         field: "duration_year",
//       },

//       mileageLimit: {
//         type: DataTypes.BIGINT,
//         field: "mileage_limit",
//       },
//     },
//     {
//       tableName: "warranty_policy",
//     }
//   );

//   WarrantyPolicy.associate = function (models) {
//     WarrantyPolicy.hasMany(models.VehicleModel, {
//       foreignKey: "warranty_policy_id",
//       as: "vehicleModels",
//     });

//     WarrantyPolicy.hasMany(models.TypeComponent, {
//       foreignKey: "warranty_policy_id",
//       as: "typeComponents",
//     });
//   };

//   return WarrantyPolicy;
// };
