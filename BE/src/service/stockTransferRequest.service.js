import { Transaction } from "sequelize";
import db from "../models/index.cjs";
import dayjs from "dayjs";
import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";
import { ConflictError } from "../error/index.js";

class StockTransferRequestService {
  #stockTransferRequestRepository;
  #stockTransferRequestItemRepository;
  #stockReservationRepository;
  #caselineRepository;
  #warehouseRepository;
  #componentRepository;
  #typeComponentRepository;
  #notificationService;

  constructor({
    stockTransferRequestRepository,
    stockTransferRequestItemRepository,
    stockReservationRepository,
    caselineRepository,
    warehouseRepository,
    componentRepository,
    typeComponentRepository,
    notificationService,
  }) {
    this.#stockTransferRequestRepository = stockTransferRequestRepository;
    this.#stockTransferRequestItemRepository =
      stockTransferRequestItemRepository;
    this.#stockReservationRepository = stockReservationRepository;
    this.#caselineRepository = caselineRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#componentRepository = componentRepository;
    this.#typeComponentRepository = typeComponentRepository;
    this.#notificationService = notificationService;
  }

  createStockTransferRequest = async ({
    requestingWarehouseId,
    items,
    caselineIds,
    requestedByUserId,
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
  }) => {
    const stockTransferRequest =
      await this.#stockTransferRequestRepository.getStockTransferRequestById({
        id,
        userId,
        roleName,
        serviceCenterId,
      });

    return stockTransferRequest;
  };

  approveStockTransferRequest = async ({
    id,
    roleName,
    companyId,
    approvedByUserId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const approvedStockTransferRequest =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          {
            id,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!approvedStockTransferRequest) {
        return null;
      }

      if (approvedStockTransferRequest.status !== "PENDING_APPROVAL") {
        throw new ConflictError(
          `Only requests with status PENDING_APPROVAL can be approved. Current status: ${approvedStockTransferRequest.status}`
        );
      }

      const requestId = approvedStockTransferRequest.id;

      const stockTransferRequestItems =
        await this.#stockTransferRequestItemRepository.getStockTransferRequestItemsByRequestId(
          {
            requestId: requestId,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (
        !stockTransferRequestItems ||
        stockTransferRequestItems.length === 0
      ) {
        throw new Error(`Request ${requestId} has no items.`);
      }

      const typeComponentIdsNeeded = stockTransferRequestItems.map(
        (item) => item.typeComponentId
      );

      const stocks =
        await this.#warehouseRepository.findStocksByTypeComponentOrderByWarehousePriority(
          {
            typeComponentIds: typeComponentIdsNeeded,
            context: "COMPANY",
            entityId: companyId,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      const stocksGroupedByType = stocks.reduce((acc, stock) => {
        if (!acc[stock.typeComponent.typeComponentId]) {
          acc[stock.typeComponent.typeComponentId] = [];
        }

        acc[stock.typeComponent.typeComponentId].push(stock);

        return acc;
      }, {});

      const stockReservationsToCreate = [];
      const stockUpdates = [];

      for (const item of stockTransferRequestItems) {
        const stocksForItem = stocksGroupedByType[item.typeComponentId] || [];

        const totalAvailable = stocksForItem.reduce(
          (sum, s) => sum + (s.quantityInStock - s.quantityReserved),
          0
        );

        if (totalAvailable < item.quantityRequested) {
          throw new ConflictError(
            `Not enough available stock in company warehouse for component '${item.typeComponentId}'. ` +
              `Requested: ${item.quantityRequested}, Total available: ${totalAvailable}.`
          );
        }

        const allocations = this.#allocateStock({
          stocks: stocksForItem,
          item: {
            typeComponentId: item.typeComponentId,
            quantityReserved: item.quantityRequested,
          },
        });

        for (const allocation of allocations) {
          stockReservationsToCreate.push({
            stockId: allocation.stockId,
            requestId: requestId,
            typeComponentId: item.typeComponentId,
            quantityReserved: allocation.quantityReserved,
            status: "RESERVED",
          });

          stockUpdates.push({
            stockId: allocation.stockId,
            quantityReserved: allocation.quantityReserved,
          });
        }
      }

      if (stockReservationsToCreate.length > 0) {
        await this.#stockReservationRepository.bulkCreate(
          { reservations: stockReservationsToCreate },
          transaction
        );
      }

      if (stockUpdates.length > 0) {
        await this.#warehouseRepository.bulkUpdateStockQuantities(
          stockUpdates,
          transaction
        );
      }

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

      const roomName = `oem_warehouse_dispatchers_${companyId}`;
      const eventName = "stock_transfer_request_approved";
      const data = { requestWithDetails };

      this.#notificationService.sendToRoom(roomName, eventName, data);

      return {
        stockReservations: stockReservationsToCreate,
        updatedStockTransferRequest,
      };
    });

    return rawResult;
  };

  shipStockTransferRequest = async ({
    requestId,
    roleName,
    serviceCenterId,
    estimatedDeliveryDate,
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

      if (existingRequest.status !== "APPROVED") {
        throw new ConflictError(
          `Only approved requests can be shipped. Current status: ${existingRequest.status}`
        );
      }

      const reservations =
        await this.#stockReservationRepository.findByRequestId(
          { requestId },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!reservations || reservations.length === 0) {
        throw new Error(`No stock reservations found for request ${requestId}`);
      }

      const reservationsByType = reservations.reduce((acc, reservation) => {
        if (!acc[reservation.typeComponentId]) {
          acc[reservation.typeComponentId] = [];
        }
        acc[reservation.typeComponentId].push(reservation);
        return acc;
      }, {});

      const stockIds = reservations.map((r) => r.stockId);
      const stocks = await this.#warehouseRepository.findStocksByIds(
        { stockIds },
        transaction,
        Transaction.LOCK.UPDATE
      );

      const stocksMap = new Map(stocks.map((s) => [s.stockId, s]));

      const componentCollections = [];
      for (const item of existingRequest.items) {
        const reservationsForItem =
          reservationsByType[item.typeComponentId] || [];

        const componentIds = await this.#collectComponentsFromReservations({
          reservations: reservationsForItem,
          item,
          stocksMap,
          transaction,
        });

        componentCollections.push({
          typeComponentId: item.typeComponentId,
          componentIds,
        });
      }

      const allComponentIds = componentCollections.flatMap(
        (c) => c.componentIds
      );
      await this.#componentRepository.bulkUpdateStatus(
        {
          componentIds: allComponentIds,
          status: "IN_TRANSIT",
          requestId: requestId,
        },
        transaction
      );

      const stockUpdates = [];
      for (const reservation of reservations) {
        stockUpdates.push({
          stockId: reservation.stockId,
          quantityInStock: -reservation.quantityReserved,
          quantityReserved: -reservation.quantityReserved,
        });
      }

      await this.#warehouseRepository.bulkUpdateStockQuantities(
        { reservations: stockUpdates },
        transaction
      );

      const reservationIds = reservations.map((r) => r.id);
      await this.#stockReservationRepository.bulkUpdateStatus(
        { reservationIds, status: "SHIPPED" },
        transaction
      );

      const updatedRequest =
        await this.#stockTransferRequestRepository.updateStockTransferRequestStatus(
          {
            requestId,
            status: "SHIPPED",
            shippedAt: formatUTCtzHCM(dayjs()),
            estimatedDeliveryDate,
          },
          transaction
        );

      return {
        updatedRequest,
        componentCollections,
      };
    });

    return rawResult;
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
          { requestId },
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

      const componentsInTransit =
        await this.#componentRepository.findComponentsByRequestId(
          { requestId },
          transaction,
          Transaction.LOCK.UPDATE
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
      await this.#componentRepository.bulkUpdateStatusAndWarehouse(
        {
          componentIds: allComponentIds,
          status: "IN_WAREHOUSE",
          warehouseId: warehouseId,
        },
        transaction
      );

      const stockUpdates = [];
      for (const [typeComponentId, components] of Object.entries(
        componentsByType
      )) {
        const existingStock =
          await this.#warehouseRepository.findStockByWarehouseAndType(
            {
              warehouseId: warehouseId,
              typeComponentId: parseInt(typeComponentId),
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
          { reservations: stockUpdates },
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

      const requestItems =
        await this.#stockTransferRequestItemRepository.getStockTransferRequestItemsByRequestId(
          { requestId },
          transaction
        );

      const caselineIds = requestItems
        .map((item) => item.caselineId)
        .filter((id) => id);

      if (caselineIds.length > 0) {
        await this.#caselineRepository.bulkUpdateStatusByIds(
          {
            caselineIds,
            status: "READY_FOR_REPAIR",
          },
          transaction
        );
      }

      const requestWithDetails =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          { requestId },
          transaction
        );

      const roomName = `service_center_staff_${serviceCenterId}`;
      const eventName = "stock_transfer_request_received";
      const data = { requestWithDetails };

      this.#notificationService.sendToRoom(roomName, eventName, data);

      return {
        updatedRequest,
        receivedComponentsCount: allComponentIds.length,
        componentsByType,
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
          { requestId },
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

      const updatedRequest =
        await this.#stockTransferRequestRepository.updateStockTransferRequestStatusRejected(
          {
            requestId,
            rejectedByUserId,
            rejectionReason,
          },
          transaction
        );

      return updatedRequest;
    });

    return rawResult;
  };

  cancelStockTransferRequest = async ({
    requestId,
    cancelledByUserId,
    cancellationReason,
    roleName,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const existingRequest =
        await this.#stockTransferRequestRepository.getStockTransferRequestById(
          { requestId },
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
              { reservations: stockUpdates },
              transaction
            );

            const reservationIds = reservations.map((r) => r.id);
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

    return rawResult;
  };

  #collectComponentsFromReservations = async ({
    reservations,
    item,
    stocksMap,
    transaction,
  }) => {
    const allComponents = [];
    for (const reservation of reservations) {
      const stock = stocksMap.get(reservation.stockId);

      if (!stock) {
        throw new NotFoundError(
          `Stock with ID ${reservation.stockId} not found`
        );
      }

      const components =
        await this.#componentRepository.findAvailableComponents(
          {
            typeComponentId: item.typeComponentId,
            warehouseId: stock.warehouse.warehouseId,
            limit: reservation.quantityReserved,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (components.length < reservation.quantityReserved) {
        throw new ConflictError(
          `Insufficient available components in warehouse ${stock.warehouseId}. ` +
            `Requested: ${reservation.quantityReserved}, Available: ${components.length}`
        );
      }

      allComponents.push(...components);
    }

    if (allComponents.length === 0) {
      throw new ConflictError("No components collected from reservations");
    }

    const componentIds = allComponents.map(
      (component) => component.componentId
    );

    return componentIds;
  };

  #allocateStock = ({ stocks, item }) => {
    const reservations = [];

    let remainingQuantity = item.quantityReserved;

    for (const stock of stocks) {
      const availableQuantity = stock.quantityInStock - stock.quantityReserved;

      if (availableQuantity <= 0) {
        continue;
      }

      const quantityToAllocate = Math.min(availableQuantity, remainingQuantity);

      reservations.push({
        stockId: stock.stockId,
        quantityReserved: quantityToAllocate,
      });

      stock.quantityReserved += quantityToAllocate;
      remainingQuantity -= quantityToAllocate;

      if (remainingQuantity === 0) {
        break;
      }
    }

    if (remainingQuantity > 0) {
      throw new Error(
        `Unable to allocate the requested quantity from available stocks for item: ${item.id} with type-component: ${item.typeComponentId} of request ${item.requestId}`
      );
    }

    return reservations;
  };

  #validateStockAvailability = (stocks, item) => {
    let totalAvailableQuantity = 0;

    for (const stock of stocks) {
      if (stock.typeComponentId === item.typeComponentId) {
        const availableQuantity =
          stock.quantity_in_stock - stock.quantity_reserved;
        totalAvailableQuantity += availableQuantity;
      }
    }

    if (totalAvailableQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for typeComponentId: ${item.typeComponentId}`
      );
    }

    return true;
  };
}

export default StockTransferRequestService;
