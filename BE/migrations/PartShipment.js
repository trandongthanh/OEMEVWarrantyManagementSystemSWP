// module.exports = (sequelize, DataTypes) => {
//   const PartShipment = sequelize.define(
//     "PartShipment",
//     {
//       partShipmentId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "part_shipment_id",
//       },
//       guaranteeCaseId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "guarantee_case_id",
//       },
//       status: {
//         type: DataTypes.ENUM("shipping", "delivered"),
//         allowNull: false,
//         field: "status",
//       },
//       fromWarehouseId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "from_warehouse_id",
//       },
//       toWarehouseId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "to_warehouse_id",
//       },
//     },
//     {
//       tableName: "part_ship_ment",
//     }
//   );

//   PartShipment.associate = function (models) {
//     PartShipment.hasMany(models.PartShipmentDetail, {
//       foreignKey: "part_shipment_id",
//       as: "partShipmentDetails",
//     });

//     PartShipment.belongsTo(models.GuaranteeCase, {
//       foreignKey: "guarantee_case_id",
//       as: "guarantee",
//     });

//     PartShipment.belongsTo(models.Warehouse, {
//       foreignKey: "from_warehouse_id",
//       as: "fromWarehouse",
//     });

//     PartShipment.belongsTo(models.Warehouse, {
//       foreignKey: "to_warehouse_id",
//       as: "toWarehouse",
//     });
//   };

//   return PartShipment;
// };
