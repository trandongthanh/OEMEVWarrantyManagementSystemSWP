// module.exports = (sequelize, DataTypes) => {
//   const Stock = sequelize.define(
//     "Stock",
//     {
//       stockId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "stock_id",
//       },
//       quantity: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         field: "quantity",
//       },
//       warehouseId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "warehouse_id",
//       },
//       typeComponentId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         field: "type_component_id",
//       },
//     },
//     {
//       tableName: "stock",
//     }
//   );

//   Stock.associate = function (models) {
//     Stock.belongsTo(models.Warehouse, {
//       foreignKey: "warehouse_id",
//     });
//     Stock.belongsTo(models.TypeComponent, {
//       foreignKey: "type_component_id",
//     });
//   };

//   return Stock;
// };
