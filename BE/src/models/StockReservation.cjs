const { uniq } = require("awilix/lib/utils.js");

module.exports = (sequelize, DataTypes) => {
  const StockReservation = sequelize.define(
    "StockReservation",
    {
      reservationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "reservation_id",
      },

      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "request_id",
      },

      stockId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "stock_id",
      },

      typeComponentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "type_component_id",
      },

      quantityReserved: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "quantity_reserved",
      },

      status: {
        type: DataTypes.ENUM("RESERVED", "SHIPPED", "CANCELLED"),
        allowNull: false,
        defaultValue: "RESERVED",
      },
    },
    {
      tableName: "stock_reservation",
    }
  );

  StockReservation.associate = function (models) {
    StockReservation.belongsTo(models.StockTransferRequest, {
      foreignKey: "request_id",
      as: "request",
    });

    StockReservation.belongsTo(models.Stock, {
      foreignKey: "stock_id",
      as: "stock",
    });

    StockReservation.belongsTo(models.TypeComponent, {
      foreignKey: "type_component_id",
      as: "typeComponent",
    });
  };

  return StockReservation;
};
