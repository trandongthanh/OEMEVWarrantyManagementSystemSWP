// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const Campaign = sequelize.define(
//     "Campaign",
//     {
//       id: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "campaign_id",
//       },
//       name: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         field: "name",
//       },
//       startDate: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         field: "start_date",
//       },
//       endDate: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         field: "end_date",
//       },
//       description: {
//         type: DataTypes.TEXT,
//         field: "description",
//       },
//       campaignType: {
//         type: DataTypes.ENUM("campaign", "recall"),
//         field: "campaign_type",
//       },
//     },
//     {
//       tableName: "campaign",
//     }
//   );

//   Campaign.associate = function (models) {
//     Campaign.belongsToMany(models.VehicleModel, {
//       through: models.VehicleCampaign,
//       foreignKey: "campaign_id",
//       as: "vehicleModels",
//     });
//   };
//   return Campaign;
// };
