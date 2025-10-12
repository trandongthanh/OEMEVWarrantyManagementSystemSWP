module.exports = (sequelize, DataTypes) => {
  const ComponentReservation = sequelize.define(
    "ComponentReservation",
    {
      reservationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "reservation_id",
      },
      caseLineId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "case_line_id",
      },
      stockId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "stock_id",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("RESERVED", "PICKED", "USED", "CANCELLED"),
        allowNull: false,
        defaultValue: "RESERVED",
        field: "status",
      },
    },
    {
      tableName: "component_reservation",
    }
  );

  ComponentReservation.associate = function (models) {
    ComponentReservation.belongsTo(models.CaseLine, {
      foreignKey: "caseLineId",
      as: "caseLine",
    });
    ComponentReservation.belongsTo(models.Stock, {
      foreignKey: "stockId",
      as: "stock",
    });
  };

  return ComponentReservation;
};
