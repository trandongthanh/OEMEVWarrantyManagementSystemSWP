module.exports = (sequelize, DataTypes) => {
  const InventoryAdjustment = sequelize.define(
    "InventoryAdjustment",
    {
      adjustmentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "adjustment_id",
      },

      stockId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "stock_id",
        references: {
          model: "stock",
          key: "stock_id",
        },
      },

      adjustmentType: {
        type: DataTypes.ENUM("IN", "OUT"),
        allowNull: false,
        field: "adjustment_type",
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "quantity",
        validate: {
          min: 1,
        },
      },

      reason: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "reason",
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "note",
        comment: "Ghi chú chi tiết về điều chỉnh",
      },

      adjustedByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "adjusted_by_user_id",
        references: {
          model: "user",
          key: "user_id",
        },
      },

      adjustedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "adjusted_at",
        comment: "Thời gian thực hiện điều chỉnh",
      },
    },
    {
      tableName: "inventory_adjustment",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  InventoryAdjustment.associate = function (models) {
    InventoryAdjustment.belongsTo(models.Stock, {
      foreignKey: "stock_id",
      as: "stock",
    });

    InventoryAdjustment.belongsTo(models.User, {
      foreignKey: "adjusted_by_user_id",
      as: "adjustedBy",
    });
  };

  return InventoryAdjustment;
};
