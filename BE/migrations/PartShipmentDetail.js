// module.exports = (sequelize, DataTypes) => {
//   const PartShipMentDetail = sequelize.define(
//     "PartShipmentDetail",
//     {
//       partShipmentDetailId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "part_shipment_detail_id",
//       },
//       componentSeriNumber: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "component_seri_number",
//       },
//       partShipMentId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "part_shipment_id",
//       },
//       quantity: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         field: "quantity",
//       },
//     },
//     {
//       tableName: "part_shipment_detail",
//     }
//   );

//   PartShipMentDetail.associate = function (models) {
//     PartShipMentDetail.belongsTo(models.PartShipment, {
//       foreignKey: "part_shipment_id",
//       as: "partShipment",
//     });
//     PartShipMentDetail.belongsTo(models.Component, {
//       foreignKey: "component_seri_number",
//       as: "component",
//     });
//   };

//   return PartShipMentDetail;
// };
