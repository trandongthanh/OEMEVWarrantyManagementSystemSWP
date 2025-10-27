module.exports = (sequelize, DataTypes) => {
  const StockTransferRequest = sequelize.define("StockTransferRequest", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    requestingWarehouseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "requesting_warehouse_id",
    },

    requestedByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "requested_by_user_id",
    },

    approvedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "approved_by_user_id",
    },

    rejectedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "rejected_by_user_id",
    },

    cancelledByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "cancelled_by_user_id",
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING_APPROVAL",
        "APPROVED",
        "SHIPPED",
        "RECEIVED",
        "CANCELLED",
        "REJECTED"
      ),
      allowNull: false,
      defaultValue: "PENDING_APPROVAL",
    },

    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },

    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "cancellation_reason",
    },

    requestedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "requested_at",
    },

    receivedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "received_by_user_id",
    },

    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },

    shippedAt: { type: DataTypes.DATE, allowNull: true, field: "shipped_at" },

    receivedAt: { type: DataTypes.DATE, allowNull: true, field: "received_at" },

    rejectedAt: { type: DataTypes.DATE, allowNull: true, field: "rejected_at" },

    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "cancelled_at",
    },
  });

  StockTransferRequest.associate = function (models) {
    StockTransferRequest.belongsTo(models.Warehouse, {
      foreignKey: "requesting_warehouse_id",
      as: "requestingWarehouse",
    });

    StockTransferRequest.belongsTo(models.User, {
      foreignKey: "requested_by_user_id",
      as: "requester",
    });

    StockTransferRequest.hasMany(models.StockTransferRequestItem, {
      foreignKey: "request_id",
      as: "items",
    });

    StockTransferRequest.hasMany(models.StockReservation, {
      foreignKey: "request_id",
      as: "stockReservations",
    });

    StockTransferRequest.belongsTo(models.User, {
      foreignKey: "approved_by_user_id",
      as: "approver",
    });

    StockTransferRequest.belongsTo(models.User, {
      foreignKey: "rejected_by_user_id",
      as: "rejecter",
    });

    StockTransferRequest.belongsTo(models.User, {
      foreignKey: "cancelled_by_user_id",
      as: "canceller",
    });

    StockTransferRequest.belongsTo(models.User, {
      foreignKey: "received_by_user_id",
      as: "receiver",
    });
  };

  return StockTransferRequest;
};
