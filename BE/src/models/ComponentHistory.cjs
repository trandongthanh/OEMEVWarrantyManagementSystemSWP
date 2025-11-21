module.exports = (sequelize, DataTypes) => {
  const ComponentHistory = sequelize.define(
    "ComponentHistory",
    {
      historyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "history_id",
      },
      componentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "component_id",
      },
      stockTransferRequestItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "stock_transfer_request_item_id",
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "received_at",
      },
    },
    {
      tableName: "component_history",
      timestamps: false,
    }
  );

  ComponentHistory.associate = function (models) {
    ComponentHistory.belongsTo(models.Component, {
      foreignKey: "component_id",
      as: "component",
    });
    ComponentHistory.belongsTo(models.StockTransferRequestItem, {
      foreignKey: "stock_transfer_request_item_id",
      as: "stockTransferRequestItem",
    });
  };

  return ComponentHistory;
};
