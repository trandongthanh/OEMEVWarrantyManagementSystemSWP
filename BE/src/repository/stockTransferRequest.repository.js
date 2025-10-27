import dayjs from "dayjs";
import db from "../models/index.cjs";
import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";

const { StockTransferRequest, StockTransferRequestItem, User } = db;

class StockTransferRequestRepository {
  createStockTransferRequest = async (
    { requestingWarehouseId, requestedByUserId, requestedAt },
    transaction
  ) => {
    const newRequest = await StockTransferRequest.create(
      {
        requestingWarehouseId,
        requestedByUserId,
        requestedAt,
      },
      { transaction }
    );

    return newRequest.toJSON();
  };

  getAllStockTransferRequests = async ({
    userId,
    roleName,
    serviceCenterId,
    offset,
    limit,
    status,
  }) => {
    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const isServiceCenterStaff = roleName === "service_center_staff";

    if (isServiceCenterStaff) {
      whereClause["$requester.service_center_id"] = serviceCenterId;
    } else if (roleName === "service_center_manager") {
      whereClause.requestedByUserId = userId;
    }

    const requests = await StockTransferRequest.findAll({
      where: whereClause,

      include: [
        {
          model: User,
          as: "requester",
          attributes: ["userId", "name", "serviceCenterId"],

          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],

      offset,
      limit,
    });

    return requests.map((request) => request.toJSON());
  };

  getStockTransferRequestById = async (
    { id, userId, roleName, serviceCenterId },
    transaction = null,
    lock = null
  ) => {
    let whereClause = { id: id };

    const isServiceCenterStaff = roleName === "service_center_staff";

    if (isServiceCenterStaff) {
      whereClause["$requester.service_center_id$"] = serviceCenterId;
    } else if (roleName === "service_center_manager") {
      whereClause.requestedByUserId = userId;
    }

    const record = await StockTransferRequest.findOne({
      where: whereClause,

      include: [
        {
          model: User,
          as: "requester",
          attributes: ["userId", "name", "serviceCenterId"],

          required: true,
        },

        {
          model: StockTransferRequestItem,
          as: "items",
          attributes: [
            "id",
            "requestId",
            "typeComponentId",
            "quantityRequested",
          ],
          required: false,
        },
      ],

      transaction: transaction,
      lock: lock,
    });

    if (!record) {
      return null;
    }

    return record.toJSON();
  };

  updateStockTransferRequestStatus = async (
    {
      requestId,
      status,
      approvedByUserId,
      shippedAt,
      receivedAt,
      estimatedDeliveryDate,
    },
    transaction = null
  ) => {
    const updateData = { status };

    if (status === "APPROVED" && approvedByUserId) {
      updateData.approvedByUserId = approvedByUserId;
      updateData.approvedAt = formatUTCtzHCM(dayjs());
    }
    if (status === "SHIPPED" && shippedAt) {
      updateData.shippedAt = shippedAt;
      if (estimatedDeliveryDate) {
        updateData.estimatedDeliveryDate = estimatedDeliveryDate;
      }
    }
    if (status === "RECEIVED" && receivedAt) {
      updateData.receivedAt = receivedAt;
    }

    const [rowEffect] = await StockTransferRequest.update(updateData, {
      where: { id: requestId },
      transaction: transaction,
    });

    if (rowEffect <= 0) {
      return null;
    }

    const updatedRequest = await StockTransferRequest.findByPk(requestId, {
      transaction: transaction,
    });

    if (!updatedRequest) {
      return null;
    }

    return updatedRequest.toJSON();
  };

  updateStockTransferRequestStatusApproved = async (
    { requestId, status, approvedByUserId },
    transaction = null
  ) => {
    const [rowEffect] = await StockTransferRequest.update(
      { status, approvedByUserId, approvedAt },
      {
        where: { id: requestId },
        transaction: transaction,
      }
    );
    if (rowEffect <= 0) {
      return null;
    }

    const updatedRequest = await StockTransferRequest.findByPk(requestId, {
      transaction: transaction,
    });

    if (!updatedRequest) {
      return null;
    }

    return updatedRequest.toJSON();
  };

  updateStockTransferRequestStatusShipped = async (
    { requestId, status = "SHIPPED", shippedAt, estimatedDeliveryDate },
    transaction = null
  ) => {
    const [rowEffect] = await StockTransferRequest.update(
      { status, shippedAt, estimatedDeliveryDate },
      {
        where: { id: requestId },
        transaction: transaction,
      }
    );
    if (rowEffect <= 0) {
      return null;
    }

    const updatedRequest = await StockTransferRequest.findByPk(requestId, {
      transaction: transaction,
    });

    if (!updatedRequest) {
      return null;
    }

    return updatedRequest.toJSON();
  };

  updateStockTransferRequestStatusRejected = async (
    { requestId, rejectedByUserId, rejectionReason },
    transaction = null
  ) => {
    const [rowEffect] = await StockTransferRequest.update(
      {
        status: "REJECTED",
        rejectedByUserId,
        rejectionReason,
        rejectedAt: new Date(),
      },
      {
        where: { id: requestId },
        transaction: transaction,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedRequest = await StockTransferRequest.findByPk(requestId, {
      transaction: transaction,
    });

    if (!updatedRequest) {
      return null;
    }

    return updatedRequest.toJSON();
  };

  updateStockTransferRequestStatusCancelled = async (
    { requestId, cancelledByUserId, cancellationReason },
    transaction = null
  ) => {
    const [rowEffect] = await StockTransferRequest.update(
      {
        status: "CANCELLED",
        cancelledByUserId,
        cancellationReason,
        cancelledAt: new Date(),
      },
      {
        where: { id: requestId },
        transaction: transaction,
      }
    );

    if (rowEffect <= 0) {
      return null;
    }

    const updatedRequest = await StockTransferRequest.findByPk(requestId, {
      transaction: transaction,
    });

    if (!updatedRequest) {
      return null;
    }

    return updatedRequest.toJSON();
  };

  updateStockTransferRequestStatusReceived = async (
    { requestId, status = "RECEIVED", receivedAt },

    transaction = null
  ) => {
    const [rowEffect] = await StockTransferRequest.update(
      { status, receivedAt },
      {
        where: { id: requestId },
        transaction: transaction,
      }
    );
    if (rowEffect <= 0) {
      return null;
    }

    const updatedRequest = await StockTransferRequest.findByPk(requestId, {
      transaction: transaction,
    });

    if (!updatedRequest) {
      return null;
    }

    return updatedRequest.toJSON();
  };
}

export default StockTransferRequestRepository;
