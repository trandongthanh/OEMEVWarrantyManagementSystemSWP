// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const BillOfMaterial = sequelize.define("BillOfMaterial", {
//     vehicleModelId: {
//       type: DataTypes.UUID,
//       primaryKey: true,
//       field: "vehicle_model_id",
//     },
//     typeComponentId: {
//       type: DataTypes.UUID,
//       primaryKey: true,
//       field: "type_component_id",
//     },
//   });

//   BillOfMaterial.associate = function (models) {
//     BillOfMaterial.belongsTo(models.VehicleModel, {
//       foreignKey: "vehicle_model_id",
//       as: "vehicleModel",
//     });
//     BillOfMaterial.belongsTo(models.TypeComponent, {
//       foreignKey: "type_component_id",
//       as: "typeComponent",
//     });
//   };

//   return BillOfMaterial;
// };
