import { ConflictError, NotFoundError } from "../error/index.js";
import db from "../models/index.cjs";
import { allocateStock } from "../util/allocateStock.js";

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

  createCaseLines = async ({
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

      // const vehicleModelId =
      //   guaranteeCase?.vehicleProcessingRecord?.vehicle?.vehicleModelId;

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

      const updatedGuaranteeCase =
        await this.guaranteeCaseRepository.updateStatus(
          {
            guaranteeCaseId: guaranteeCaseId,
            status: "DIAGNOSED",
          },
          t
        );
      if (!updatedGuaranteeCase) {
        throw new ConflictError("Failed to update guarantee case status");
      }

      //--- validate stock and create component reservation
      // const typeComponentIds = [];
      // for (const caseline of newCaseLines) {
      //   if (caseline.componentId) {
      //     typeComponentIds.push(caseline.componentId);
      //   }
      // }

      // const stocks =
      //   await this.wareHouseRepository.findStocksByTypeComponentOrderByWarehousePriority(
      //     { typeComponentIds, serviceCenterId, vehicleModelId },
      //     t
      //   );

      // const allReservationsToCreate = [];

      // for (const caseline of newCaseLines) {
      //   const quantityNeed = caseline.quantity;

      //   const stocksFilter = stocks.filter(
      //     (stock) =>
      //       stock.typeComponent.typeComponentId === caseline.componentId
      //   );

      //   if (stocksFilter.length === 0) {
      //     throw new ConflictError("No available stock for component");
      //   }

      //   const totalAvailable = stocksFilter.reduce(
      //     (sum, stock) => sum + stock.quantityAvailable,
      //     0
      //   );

      //   if (totalAvailable < quantityNeed) {
      //     throw new ConflictError("Insufficient stock available for component");
      //   }

      //   const reservations = allocateStock({
      //     stocks: stocksFilter,
      //     quantity: quantityNeed,
      //   });

      //   for (const reservation of reservations) {
      //     const stockToUpdate = stocks.find(
      //       (stock) => stock.stockId === reservation.stockId
      //     );

      //     if (!stockToUpdate) {
      //       throw new ConflictError("Stock not found for reservation");
      //     }

      //     stockToUpdate.quantityReserved += reservation.quantity;
      //   }

      //   const reservationsWithCaseLine = reservations.map((reservation) => ({
      //     ...reservation,
      //     caseLineId: caseline.caseLineId,
      //   }));

      //   allReservationsToCreate.push(...reservationsWithCaseLine);
      // }

      // const updatedStocks =
      //   await this.wareHouseRepository.bulkUpdateStockQuantities(
      //     { allReservationsToCreate },
      //     t
      //   );

      // const componentReservations = allReservationsToCreate.map(
      //   (reservation) => {
      //     const componentReservation = {
      //       caseLineId: reservation.caseLineId,
      //       stockId: reservation.stockId,
      //       quantity: reservation.quantity,
      //     };

      //     return componentReservation;
      //   }
      // );

      // const newComponentReservations =
      //   await this.componentReservationRepository.bulkCreate(
      //     {
      //       componentReservations,
      //     },
      //     t
      //   );

      return newCaseLines;
    });
  };
}

export default CaseLineService;
