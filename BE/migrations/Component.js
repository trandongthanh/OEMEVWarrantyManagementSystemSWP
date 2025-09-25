// module.exports = (sequelize, DataTypes) => {
//   const Component = sequelize.define(
//     "Component",
//     {
//       seriNumber: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "seri_number",
//       },
//       name: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         field: "name",
//       },
//       typeComponentId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "type_component_id",
//       },
//       companyId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "company_id",
//       },
//       vehicleId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "vehicle_id",
//       },
//     },
//     {
//       tableName: "component",
//     }
//   );

//   Component.associate = function (models) {
//     Component.belongsTo(models.Vehicle, {
//       foreignKey: "vehicle_id",
//       as: "vehicle",
//     });
//     Component.belongsTo(models.TypeComponent, {
//       foreignKey: "type_component_id",
//       as: "typeComponent",
//     });
//     Component.hasMany(models.InstalledPart, {
//       foreignKey: "old_component_id",
//       as: "oldComponent",
//     });
//     Component.hasMany(models.InstalledPart, {
//       foreignKey: "new_component_id",
//       as: "newComponent",
//     });
//     Component.hasOne(models.PartShipmentDetail, {
//       foreignKey: "component_seri_number",
//       as: "partShipmentDetail",
//     });
//   };

//   return Component;
// };
