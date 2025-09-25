// module.exports = (sequelize, DataTypes) => {
//   const ComponentCompany = sequelize.define(
//     "ComponentCompany",
//     {
//       componentCompanyId: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV1,
//         primaryKey: true,
//         field: "component_company_id",
//       },
//       name: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         field: "name",
//       },
//       address: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         field: "address",
//       },
//       phone: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         field: "phone",
//       },
//       email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         field: "email",
//       },
//     },
//     {
//       tableName: "component_company",
//     }
//   );

//   ComponentCompany.associate = function (models) {
//     ComponentCompany.belongsToMany(models.TypeComponent, {
//       through: { model: models.TypeComponentByCompany, unique: false },
//       foreignKey: "component_company_id",
//     });
//   };

//   return ComponentCompany;
// };
