module.exports = (sequelize, DataTypes) => {
  const StockTransferRequestItem = sequelize.define(
    "StockTransferRequestItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "request_id",
      },

      typeComponentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "type_component_id",
      },

      quantityRequested: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "quantity_requested",
      },

      caselineId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "caseline_id",
      },
    }
  );

  StockTransferRequestItem.associate = function (models) {
    StockTransferRequestItem.belongsTo(models.StockTransferRequest, {
      foreignKey: "request_id",
      as: "request",
    });
    StockTransferRequestItem.belongsTo(models.TypeComponent, {
      foreignKey: "type_component_id",
      as: "component",
    });
    StockTransferRequestItem.belongsTo(models.CaseLine, {
      foreignKey: "caseline_id",
      as: "caseline",
    });
  };

  return StockTransferRequestItem;
};
