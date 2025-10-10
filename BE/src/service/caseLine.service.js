import { ConflictError, NotFoundError } from "../error/index.js";
import db from "../models/index.cjs";
import { allocateStock } from "../util/allocateStock";

class CaseLineService {
  constructor({
    caselineRepository,
    componentReservationRepository,
    wareHouseRepository,
    guaranteeCaseRepository,
  }) {
    this.caselineRepository = caselineRepository;
    this.componentReservationRepository = componentReservationRepository;
    this.wareHouseRepository = wareHouseRepository;
    this.guaranteeCaseRepository = guaranteeCaseRepository;
  }

  createCaseLine = async ({
    guaranteeCaseId,
    caselines,
    serviceCenterId,
    techId,
  }) => {
    return db.sequelize.transaction(async (t) => {
      //--- create caselines
      const guaranteeCase =
        await this.guaranteeCaseRepository.validateGuaranteeCase(
          { guaranteeCaseId: guaranteeCaseId },
          t
        );

      if (!guaranteeCase) {
        throw new NotFoundError("Guarantee case not found");
      }

      const isTechMain = techId === guaranteeCase.leadTechId;

      if (!isTechMain) {
        throw new ConflictError(
          "Technician is not the main technician for caselines"
        );
      }

      const vehicleModelId =
        guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId;

      const dataCaselines = caselines.map((caseline) => ({
        ...caseline,
        guaranteeCaseId: guaranteeCaseId,
        techId: techId,
      }));

      const newCaseLines = await this.caselineRepository.bulkCreate(
        { caselines: dataCaselines },
        t
      );

      if (!newCaseLines || newCaseLines.length === 0) {
        return;
      }

      //--- validate stock and create component reservation
      const typeComponentIds = [];
      for (const caseline of newCaseLines) {
        if (caseline.componentId) {
          typeComponentIds.push(caseline.componentId);
        }
      }

      const stocks =
        await this.wareHouseRepository.findStocksByTypeComponentOrderByWarehousePriority(
          { typeComponentIds, serviceCenterId, vehicleModelId }
        );

      // const quantity = caselines.reduce(
      //   (sum, caseline) => sum + caseline.quantity,
      //   0
      // );
      const ArrayOfArrayReservations = [];
      for (const caseline of newCaseLines) {
        const quantityNeed = caseline.quantity;

        const stocksFilter = stocks.filter(
          (stock) =>
            stock.typeComponent.typeComponentId === caseline.componentId
        );

        if (stocksFilter.length === 0) {
          throw new ConflictError("No available stock for component");
        }

        const totalAvailable = stocksFilter.reduce(
          (sum, stock) => sum + stock.quantity,
          0
        );

        if (totalAvailable < quantityNeed) {
          throw new ConflictError("Insufficient stock available for component");
        }

        const reservations = allocateStock({
          stocks: stocksFilter,
          quantity: quantityNeed,
        });

        for (const reservation of reservations) {
          const stockToUpdate = stocks.find(
            (stock) => stock.stockId === reservation.stockId
          );

          if (!stockToUpdate) {
            throw new ConflictError("Stock not found for reservation");
          }
        }

        ArrayOfArrayReservations.push(reservations);
      }

      const reservationsMap = new Map();
      for (const reservations of ArrayOfArrayReservations) {
        for (const reservation of reservations) {
          const existingQty = reservationsMap.get(reservation.stockId) || 0;

          reservationsMap.set(
            reservation.stockId,
            existingQty + reservation.quantity
          );
        }
      }

      const reservations = Array.from(reservationsMap.entries()).map(
        ([stockId, quantity]) => ({
          stockId,
          quantity,
        })
      );

      const updatedStocks =
        await this.wareHouseRepository.bulkUpdateStockQuantities(
          { reservations },
          t
        );

      const componentReservations = reservations.map((reservation) => {
        const componentReservation = {
          stockId: reservation.stockId,
          quantity: reservation.quantity,
        };

        return componentReservation;
      });

      const newComponentReservations =
        await this.componentReservationRepository.bulkCreate(
          {
            componentReservations,
          },
          t
        );
    });
  };
}

export default CaseLineService;
