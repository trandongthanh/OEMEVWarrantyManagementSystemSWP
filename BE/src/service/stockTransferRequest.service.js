import { Transaction } from "sequelize";
import db from "../models/index.cjs";
import dayjs from "dayjs";
import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";

class StockTransferRequestService {
  #stockTransferRequestRepository;
  #stockTransferRequestItemRepository;
  #stockReservationRepository;
  #caselineRepository;
  #warehouseRepository;
  #componentRepository;
  #notificationService;

  constructor({
    stockTransferRequestRepository,
    stockTransferRequestItemRepository,
    stockReservationRepository,
    caselineRepository,
    warehouseRepository,
    componentRepository,
    notificationService,
  }) {
    this.#stockTransferRequestRepository = stockTransferRequestRepository;
    this.#stockTransferRequestItemRepository =
      stockTransferRequestItemRepository;
    this.#stockReservationRepository = stockReservationRepository;
    this.#caselineRepository = caselineRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#componentRepository = componentRepository;
    this.#notificationService = notificationService;
  }

  createStockTransferRequest = async ({
    requestingWarehouseId,
    items,
    requestedByUserId,
    companyId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const newStockTransferRequest =
        await this.#stockTransferRequestRepository.createStockTransferRequest(
          {
            requestingWarehouseId,
            requestedByUserId,
            requestedAt: formatUTCtzHCM(dayjs()),
          },
          transaction
        );

      const itemsToCreate = items.map((item) => ({
        ...item,
        requestId: newStockTransferRequest?.id,
      }));

      const caselineIds = items.map((item) => item.caselineId);

      await this.#caselineRepository.bulkUpdateStatusByIds(
        {
          caseLineIds: caselineIds,
          status: "WAITING_FOR_PARTS",
        },
        transaction
      );

      const rawItems =
        await this.#stockTransferRequestItemRepository.createStockTransferRequestItems(
          {
            items: itemsToCreate,
          },
          transaction
        );

      return { newStockTransferRequest, rawItems };
    });

    const formatRawItems = rawResult.rawItems.map((item) => ({
      ...item,
      createdAt: formatUTCtzHCM(item.createdAt),
      updatedAt: formatUTCtzHCM(item.updatedAt),
    }));

    const roomName = `emv_staff_${companyId}`;

    this.#notificationService.sendToRoom(
      roomName,
      "new_stock_transfer_request",
      { request: rawResult.newStockTransferRequest }
    );

    return {
      newStockTransferRequest: {
        ...rawResult.newStockTransferRequest,
        createdAt: formatUTCtzHCM(rawResult.newStockTransferRequest.createdAt),
        updatedAt: formatUTCtzHCM(rawResult.newStockTransferRequest.updatedAt),
      },
      items: formatRawItems,
    };
  };

  getAllStockTransferRequests = async ({
    userId,
    roleName,
    serviceCenterId,
    companyId,
    page,
    limit,
    status,
  }) => {
    const offset = (page - 1) * limit;
    const limitNumber = parseInt(limit);
    const offsetNumber = parseInt(offset);

    const stockTransferRequests =
      await this.#stockTransferRequestRepository.getAllStockTransferRequests({
        userId,
        roleName,
        serviceCenterId,
        companyId,
        offset: offsetNumber,
        limit: limitNumber,
        status: status,
      });

    const formattedRequests = stockTransferRequests.map((request) => ({
      ...request,
      createdAt: formatUTCtzHCM(request.createdAt),
      updatedAt: formatUTCtzHCM(request.updatedAt),
    }));

    return formattedRequests;
  };

  getStockTransferRequestById = async ({
    id,
    userId,
    roleName,
    serviceCenterId,
    companyId,
  }) => {
    const stockTransferRequest =
      await this.#stockTransferRequestRepository.getStockTransferRequestById({
        id,
        userId,
        roleName,
        serviceCenterId,
        companyId,
      });

    return stockTransferRequest;
  };

  listReservationsByRequestId = async ({
    requestId,
    roleName,
    serviceCenterId,
    companyId,
    status,
  }) => {
    await this.#stockTransferRequestRepository.getStockTransferRequestById({
      id: requestId,
      roleName,
      companyId,
      serviceCenterId,
    });

    let statusesParam;

    if (!status) {
      statusesParam = ["RESERVED"];
    } else if (typeof status === "string") {
      if (status.toUpperCase() === "ALL") {
        statusesParam = "ALL";
      } else {
        statusesParam = status
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean);
      }
    } else {
      statusesParam = status;
    }

    const reservations = await this.#stockReservationRepository.findByRequestId(
      { requestId, statuses: statusesParam },
      null,
      null
    );

    return reservations.map((reservation) => ({
      reservationId: reservation.reservationId,
      requestItemId: reservation.requestItemId,
      status: reservation.status,
      quantityReserved: reservation.quantityReserved,
      stockId: reservation.stockId,
      warehouse: reservation.stock?.warehouse
        ? {
            warehouseId: reservation.stock.warehouse.warehouseId,
            name: reservation.stock.warehouse.name,
          }
        : null,
      typeComponent: reservation.requestItem?.component
        ? {
            typeComponentId: reservation.requestItem.component.typeComponentId,
            name: reservation.requestItem.component.name,
            sku: reservation.requestItem.component.sku,
          }
        : null,
      typeComponentId: reservation.requestItem?.typeComponentId ?? null,
      quantityRequested: reservation.requestItem?.quantityRequested ?? null,
    }));
  };

  approveStockTransferRequest = async ({
    id,
    roleName,
    companyId,
    approvedByUserId,
  }) => {
    return db.sequelize.transaction(async (transaction) => {
      const request = await this.#getAndValidatePendingRequest(
        {
          requestId: id,
          roleName,
          companyId,
        },
        transaction
      );

      const requestItems = await this.#getAndValidateRequestItems(
        request.id,
        transaction
      );

      const itemTypeMap = new Map(
        requestItems.map((item) => [item.id, item.typeComponentId])
      );

      const { reservationsToCreate, stockAdjustments } =
        await this.#buildReservationsForRequest({
          requestItems,
          companyId,
          transaction,
        });

      let createdReservations = [];

      if (reservationsToCreate.length > 0) {
        createdReservations = await this.#stockReservationRepository.bulkCreate(
          { reservations: reservationsToCreate },
          transaction
        );

        createdReservations = createdReservations.map((reservation) => ({
          ...reservation,
          requestId: request.id,
          typeComponentId: itemTypeMap.get(reservation.requestItemId) ?? null,
        }));
      }

      if (stockAdjustments.length > 0) {
        await this.#warehouseRepository.bulkUpdateStockQuantities(
          stockAdjustments,
          transaction
        );
      }

      const updatedRequest = await this.#updateRequestStatusAndNotify(
        request.id,
        approvedByUserId,
        companyId,
        transaction
      );

      return {
        stockReservations: createdReservations,
        updatedStockTransferRequest: updatedRequest,
      };
    });
  };

  shipStockTransferRequest = async ({
    requestId,
    reservationId,
    componentIds,
    roleName,
    companyId,
    serviceCenterId,
    estimatedDeliveryDate,
  }) => {
    if (!reservationId) {
      throw new BadRequestError("reservationId là bắt buộc");
    }

    if (!Array.isArray(componentIds) || componentIds.length === 0) {
      throw new BadRequestError(
        "componentIds phải là mảng và có ít nhất một phần tử"
      );
    }

    const uniqueComponentIds = new Set();

    componentIds.forEach((componentId, index) => {
      if (!componentId) {
        throw new BadRequestError(`componentIds[${index}] không hợp lệ`);
      }

      if (uniqueComponentIds.has(componentId)) {
        throw new BadRequestError(
          `componentIds chứa phần tử trùng: ${componentId}`
        );
      }

      uniqueComponentIds.add(componentId);
    });

    const distinctComponentIds = Array.from(uniqueComponentIds);

    const { shippedReservation, updatedRequest, requestFullyShipped } =
      await db.sequelize.transaction(async (transaction) => {
        await this.#getAndValidateApprovedRequest(
          {
            requestId,
            roleName,
            companyId,
            serviceCenterId,
          },
          transaction
        );

        const reservation =
          await this.#stockReservationRepository.findByIdWithDetails(
            { reservationId },
            transaction,
            Transaction.LOCK.UPDATE
          );

        if (!reservation) {
          throw new NotFoundError(
            `Không tìm thấy reservation ${reservationId}`
          );
        }

        if (reservation.requestItem?.requestId !== requestId) {
          throw new ConflictError(
            `Reservation ${reservationId} không thuộc yêu cầu ${requestId}`
          );
        }

        if (reservation.status !== "RESERVED") {
          throw new ConflictError(
            `Reservation ${reservationId} không còn ở trạng thái chờ gửi`
          );
        }

        if (distinctComponentIds.length !== reservation.quantityReserved) {
          throw new ConflictError(
            `Reservation cần ${reservation.quantityReserved} component`
          );
        }

        const warehouseId = reservation.stock?.warehouse?.warehouseId;
        const stockId = reservation.stockId;
        const typeComponentId = reservation.requestItem?.typeComponentId;

        if (!warehouseId || !stockId || !typeComponentId) {
          throw new ConflictError(
            `Reservation ${reservationId} thiếu thông tin kho hoặc loại component`
          );
        }

        const components = await this.#componentRepository.findComponentsByIds(
          { componentIds: distinctComponentIds },
          transaction,
          Transaction.LOCK.UPDATE
        );

        if (!components || components.length !== distinctComponentIds.length) {
          throw new ConflictError(
            "Không tìm thấy đầy đủ component theo yêu cầu"
          );
        }

        for (const component of components) {
          if (component.status !== "IN_WAREHOUSE") {
            throw new ConflictError(
              `Component ${component.componentId} không ở trạng thái IN_WAREHOUSE`
            );
          }

          if (!component.warehouseId) {
            throw new ConflictError(
              `Component ${component.componentId} không thuộc kho nào`
            );
          }

          if (component.warehouseId !== warehouseId) {
            throw new ConflictError(
              `Component ${component.componentId} không nằm trong kho reserve`
            );
          }

          if (component.typeComponentId !== typeComponentId) {
            throw new ConflictError(
              `Component ${component.componentId} không khớp loại yêu cầu`
            );
          }

          if (
            component.stockTransferRequestItemId &&
            component.stockTransferRequestItemId !== reservation.requestItemId
          ) {
            throw new ConflictError(
              `Component ${component.componentId} đã được gán cho request item khác`
            );
          }
        }

        await this.#componentRepository.bulkUpdateStatus(
          {
            componentIds: distinctComponentIds,
            status: "IN_TRANSIT",
            stockTransferRequestItemId: reservation.requestItemId,
            warehouseId: null,
          },

          transaction
        );

        await this.#warehouseRepository.bulkUpdateStockQuantities(
          [
            {
              stockId,
              quantityInStock: -reservation.quantityReserved,
              quantityReserved: -reservation.quantityReserved,
            },
          ],
          transaction
        );

        await this.#stockReservationRepository.markReservationsAsShipped(
          { reservationIds: [reservationId] },
          transaction
        );

        const remainingReservations =
          await this.#stockReservationRepository.countReservedByRequestId(
            { requestId },
            transaction
          );

        let requestFullyShipped = false;
        let updatedRequest = null;

        if (remainingReservations === 0) {
          if (!estimatedDeliveryDate) {
            throw new BadRequestError(
              "estimatedDeliveryDate là bắt buộc khi ship reservation cuối cùng"
            );
          }

          updatedRequest =
            await this.#stockTransferRequestRepository.updateStockTransferRequestStatus(
              {
                requestId,
                status: "SHIPPED",
                shippedAt: formatUTCtzHCM(dayjs()),
                estimatedDeliveryDate,
              },
              transaction
            );
          requestFullyShipped = true;
        }

        return {
          shippedReservation: {
            ...reservation,
            status: "SHIPPED",
            componentIds: distinctComponentIds,
          },
          updatedRequest,
          requestFullyShipped,
        };
      });

    if (requestFullyShipped) {
      this.#sendShipmentNotifications(serviceCenterId, requestId);
    }

    return {
      shippedReservation,
      shippedComponentsCount: distinctComponentIds.length,
      updatedRequest,
      requestFullyShipped,
    };
  };

  receiveStockTransferRequest = async ({
    requestId,
    userId,
    roleName,
    serviceCenterId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingRequest =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          { id: requestId },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!existingRequest) {
        throw new NotFoundError(
          `Stock transfer request with ID ${requestId} not found`
        );
      }

      if (existingRequest.status !== "SHIPPED") {
        throw new ConflictError(
          `Only shipped requests can be received. Current status: ${existingRequest.status}`
        );
      }

      const warehouseId = existingRequest.requestingWarehouseId;

      const targetWarehouse = await this.#warehouseRepository.findById(
        { warehouseId },
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!targetWarehouse) {
        throw new NotFoundError(
          `Target warehouse with ID ${warehouseId} not found`
        );
      }

      const componentsInTransit = existingRequest.items.flatMap(
        (item) => item.components || []
      );

      if (!componentsInTransit || componentsInTransit.length === 0) {
        throw new ConflictError(
          `No components in transit found for request ${requestId}`
        );
      }

      const componentsByType = componentsInTransit.reduce((acc, component) => {
        const typeId = component.typeComponentId;

        if (!acc[typeId]) {
          acc[typeId] = [];
        }

        acc[typeId].push(component);
        return acc;
      }, {});

      const allComponentIds = componentsInTransit.map((c) => c.componentId);

      await this.#componentRepository.bulkUpdateStatus(
        {
          componentIds: allComponentIds,
          status: "IN_WAREHOUSE",
          stockTransferRequestItemId: null, // Detach from the item
          warehouseId: warehouseId,
        },
        transaction
      );

      const stockUpdates = [];
      for (const [typeComponentId, components] of Object.entries(
        componentsByType
      )) {
        const existingStock =
          await this.#warehouseRepository.findStockByWarehouseAndTypeComponent(
            {
              warehouseId: warehouseId,
              typeComponentId: typeComponentId,
            },
            transaction,
            Transaction.LOCK.UPDATE
          );

        if (existingStock) {
          stockUpdates.push({
            stockId: existingStock.stockId,
            quantityInStock: components.length,
            quantityReserved: 0,
          });
        } else {
          await this.#warehouseRepository.createStock(
            {
              warehouseId: warehouseId,
              typeComponentId: typeComponentId,
              quantityInStock: components.length,
              quantityReserved: 0,
            },
            transaction
          );
        }
      }

      if (stockUpdates.length > 0) {
        await this.#warehouseRepository.bulkUpdateStockQuantities(
          stockUpdates,
          transaction
        );
      }

      const updatedRequest =
        await this.#stockTransferRequestRepository.updateStockTransferRequestStatus(
          {
            requestId,
            status: "RECEIVED",
            receivedAt: formatUTCtzHCM(dayjs()),
          },
          transaction
        );

      const relatedCaseLineIds = existingRequest.items
        ?.map((item) => item.caselineId)
        .filter(Boolean);

      if (relatedCaseLineIds && relatedCaseLineIds.length > 0) {
        await this.#caselineRepository.bulkUpdateStatusByIds(
          {
            caseLineIds: relatedCaseLineIds,
            status: "PARTS_AVAILABLE",
          },
          transaction,
          Transaction.LOCK.UPDATE
        );
      }

      const requestWithDetails =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          { id: requestId },
          transaction
        );

      const roomName_service_center_staff = `service_center_staff_${serviceCenterId}`;
      const roomName_service_center_manager = `service_center_manager_${serviceCenterId}`;
      const eventName = "stock_transfer_request_received";
      const data = {
        requestWithDetails,
        updatedCaselineStatus: relatedCaseLineIds?.map((caselineId) => ({
          caselineId,
          status: "PARTS_AVAILABLE",
        })),
      };

      this.#notificationService.sendToRooms(
        [roomName_service_center_staff, roomName_service_center_manager],
        eventName,
        data
      );

      return {
        updatedRequest,
        receivedComponentsCount: allComponentIds.length,
      };
    });

    return rawResult;
  };

  rejectStockTransferRequest = async ({
    requestId,
    rejectedByUserId,
    rejectionReason,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingRequest =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          { id: requestId },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!existingRequest) {
        throw new NotFoundError(
          `Stock transfer request with ID ${requestId} not found`
        );
      }

      if (existingRequest.status !== "PENDING_APPROVAL") {
        throw new ConflictError(
          `Only pending requests can be rejected. Current status: ${existingRequest.status}`
        );
      }

      const caselineIds = existingRequest.items.map((item) => item.caselineId);

      await this.#caselineRepository.bulkUpdateStatusByIds(
        {
          caseLineIds: caselineIds,
          status: "REJECTED_BY_OEM",
        },
        transaction
      );

      const updatedRequest =
        await this.#stockTransferRequestRepository.updateStockTransferRequestStatusRejected(
          {
            requestId,
            rejectedByUserId,
            rejectionReason,
          },
          transaction
        );

      return {
        updatedRequest,
        requesterServiceCenterId: existingRequest.requester?.serviceCenterId,
      };
    });

    const { updatedRequest, requesterServiceCenterId } = rawResult;

    if (requesterServiceCenterId) {
      const roomNameServiceCenterStaff = `service_center_staff_${requesterServiceCenterId}`;
      const roomNameServiceCenterManager = `service_center_manager_${requesterServiceCenterId}`;

      const eventName = "stock_transfer_request_rejected";
      const data = { requestId };

      this.#notificationService.sendToRooms(
        [roomNameServiceCenterStaff, roomNameServiceCenterManager],
        eventName,
        data
      );
    }

    return updatedRequest;
  };

  cancelStockTransferRequest = async ({
    requestId,
    cancelledByUserId,
    cancellationReason,
    roleName,
    companyId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingRequest =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          { id: requestId },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!existingRequest) {
        throw new NotFoundError(
          `Stock transfer request with ID ${requestId} not found`
        );
      }

      if (roleName === "service_center_manager") {
        if (existingRequest.status !== "PENDING_APPROVAL") {
          throw new ConflictError(
            `Service Center Manager can only cancel pending requests. Current status: ${existingRequest.status}`
          );
        }
      }

      if (roleName === "emv_staff") {
        if (
          !["PENDING_APPROVAL", "APPROVED"].includes(existingRequest.status)
        ) {
          throw new ConflictError(
            `EMV Staff can only cancel pending or approved requests. Current status: ${existingRequest.status}`
          );
        }

        if (existingRequest.status === "APPROVED") {
          const reservations =
            await this.#stockReservationRepository.findByRequestId(
              { requestId },
              transaction,
              Transaction.LOCK.UPDATE
            );

          if (reservations && reservations.length > 0) {
            const stockUpdates = [];
            for (const reservation of reservations) {
              stockUpdates.push({
                stockId: reservation.stockId,
                quantityReserved: -reservation.quantityReserved,
              });
            }

            await this.#warehouseRepository.bulkUpdateStockQuantities(
              stockUpdates,
              transaction
            );

            const reservationIds = reservations.map((r) => r.reservationId);
            await this.#stockReservationRepository.bulkUpdateStatus(
              { reservationIds, status: "CANCELLED" },
              transaction
            );
          }
        }
      }

      const updatedRequest =
        await this.#stockTransferRequestRepository.updateStockTransferRequestStatusCancelled(
          {
            requestId,
            cancelledByUserId,
            cancellationReason,
          },
          transaction
        );

      return updatedRequest;
    });

    const { updatedRequest } = rawResult;

    const roomName = `emv_staff_${companyId}`;

    const eventName = "stock_transfer_request_cancelled";
    const data = { updatedRequest };

    this.#notificationService.sendToRooms([roomName], eventName, data);

    return rawResult;
  };

  #getAndValidatePendingRequest = async (
    { requestId, roleName, companyId, serviceCenterId },
    transaction
  ) => {
    const request =
      await this.#stockTransferRequestRepository.getStockTransferRequestById(
        {
          id: requestId,
          roleName,
          companyId,
          serviceCenterId,
        },
        transaction,
        Transaction.LOCK.UPDATE
      );

    if (!request) {
      throw new NotFoundError(
        `Stock transfer request with ID ${requestId} not found.`
      );
    }

    if (request.status !== "PENDING_APPROVAL") {
      throw new ConflictError(
        `Only requests with status PENDING_APPROVAL can be approved. Current status: ${request.status}`
      );
    }
    return request;
  };

  #getAndValidateRequestItems = async (requestId, transaction) => {
    const items =
      await this.#stockTransferRequestItemRepository.getStockTransferRequestItemsByRequestId(
        { requestId },
        transaction,
        Transaction.LOCK.UPDATE
      );

    if (!items || items.length === 0) {
      throw new NotFoundError(`Request ${requestId} has no items.`);
    }
    return items;
  };

  #buildReservationsForRequest = async ({
    requestItems,
    companyId,
    transaction,
  }) => {
    if (!requestItems || requestItems.length === 0) {
      return { reservationsToCreate: [], stockAdjustments: [] };
    }

    const typeComponentIds = [
      ...new Set(requestItems.map((item) => item.typeComponentId)),
    ];

    const stocks =
      await this.#warehouseRepository.findStocksByTypeComponentOrderByWarehousePriority(
        {
          typeComponentIds,
          context: "COMPANY",
          entityId: companyId,
        },
        transaction,
        Transaction.LOCK.UPDATE
      );

    const stocksByType = new Map();

    for (const stock of stocks || []) {
      const typeId = stock.typeComponent.typeComponentId;

      if (!stocksByType.has(typeId)) {
        stocksByType.set(typeId, []);
      }

      stocksByType.get(typeId).push(stock);
    }

    const reservations = [];

    const stockAdjustments = [];

    for (const item of requestItems) {
      const candidateStocks = stocksByType.get(item.typeComponentId) || [];

      let remaining = item.quantityRequested;

      for (const stock of candidateStocks) {
        const available = Math.max(
          stock.quantityInStock - stock.quantityReserved,
          0
        );

        if (available === 0) {
          continue;
        }

        const allocate = Math.min(available, remaining);

        if (allocate === 0) {
          continue;
        }

        reservations.push({
          stockId: stock.stockId,
          requestItemId: item.id,
          quantityReserved: allocate,
          status: "RESERVED",
        });

        stockAdjustments.push({
          stockId: stock.stockId,
          quantityReserved: allocate,
        });

        stock.quantityReserved += allocate;
        remaining -= allocate;

        if (remaining === 0) {
          break;
        }
      }

      if (remaining > 0) {
        const allocated = item.quantityRequested - remaining;
        throw new ConflictError(
          `Not enough stock for component '${item.typeComponentId}'. ` +
            `Requested: ${item.quantityRequested}, Reserved: ${allocated}.`
        );
      }
    }

    return { reservationsToCreate: reservations, stockAdjustments };
  };

  #updateRequestStatusAndNotify = async (
    requestId,
    approvedByUserId,
    companyId,
    transaction
  ) => {
    const updatedStockTransferRequest =
      await this.#stockTransferRequestRepository.updateStockTransferRequestStatus(
        { requestId, status: "APPROVED", approvedByUserId },
        transaction
      );

    const requestWithDetails =
      await this.#stockTransferRequestRepository.getStockTransferRequestById(
        { id: requestId },
        transaction
      );

    const roomName = `parts_coordinator_company_${companyId}`;
    const eventName = "stock_transfer_request_approved";
    const data = { requestWithDetails };

    this.#notificationService.sendToRoom(roomName, eventName, data);
    return updatedStockTransferRequest;
  };

  #getAndValidateApprovedRequest = async (
    { requestId, roleName, companyId, serviceCenterId },
    transaction
  ) => {
    const request =
      await this.#stockTransferRequestRepository.getStockTransferRequestById(
        {
          id: requestId,
          roleName,
          companyId,
          serviceCenterId,
        },
        transaction,
        Transaction.LOCK.UPDATE
      );

    if (!request) {
      throw new NotFoundError(
        `Stock transfer request with ID ${requestId} not found`
      );
    }

    if (request.status !== "APPROVED") {
      throw new ConflictError(
        `Only approved requests can be shipped. Current status: ${request.status}`
      );
    }

    return request;
  };

  #getAndValidateReservations = async (requestId, transaction) => {
    const reservations = await this.#stockReservationRepository.findByRequestId(
      { requestId },
      transaction,
      Transaction.LOCK.UPDATE
    );

    if (!reservations || reservations.length === 0) {
      throw new ConflictError(
        `No stock reservations found for request ${requestId}`
      );
    }

    return reservations;
  };

  #sendShipmentNotifications = (serviceCenterId, requestId) => {
    const roomNameServiceCenterStaff = `service_center_staff_${serviceCenterId}`;
    const roomNameServiceCenterManager = `service_center_manager_${serviceCenterId}`;
    const roomNamePartsCoordinatorServiceCenter = `parts_coordinator_service_center_${serviceCenterId}`;

    const eventName = "stock_transfer_request_shipped";
    const data = { requestId };

    this.#notificationService.sendToRooms(
      [
        roomNameServiceCenterStaff,
        roomNameServiceCenterManager,
        roomNamePartsCoordinatorServiceCenter,
      ],
      eventName,
      data
    );
  };
}

export default StockTransferRequestService;
