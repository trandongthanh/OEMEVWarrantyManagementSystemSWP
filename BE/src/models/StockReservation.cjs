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

      stockId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "stock_id",
      },

      requestItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "request_item_id",
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
    StockReservation.belongsTo(models.Stock, {
      foreignKey: "stock_id",
      as: "stock",
    });

    StockReservation.belongsTo(models.StockTransferRequestItem, {
      foreignKey: "request_item_id",
      as: "requestItem",
    });
  };

  return StockReservation;
};
