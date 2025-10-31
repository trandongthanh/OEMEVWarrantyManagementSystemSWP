class ComponentReservationsController {
  #componentReservationsService;
  constructor({ componentReservationsService }) {
    this.#componentReservationsService = componentReservationsService;
  }

  getComponentReservations = async (req, res, next) => {
    const {
      page,
      limit,
      status,
      warehouseId,
      typeComponentId,
      caseLineId,
      guaranteeCaseId,
      vehicleProcessingRecordId,
      repairTechId,
      repairTechPhone,
      sortBy,
      sortOrder,
    } = req.query;

    const { serviceCenterId } = req.user;

    const result =
      await this.#componentReservationsService.getComponentReservations({
        page,
        limit,
        status,
        warehouseId,
        typeComponentId,
        caseLineId,
        guaranteeCaseId,
        vehicleProcessingRecordId,
        repairTechId,
        repairTechPhone,
        sortBy,
        sortOrder,
        serviceCenterId,
      });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  pickupReservedComponents = async (req, res, next) => {
    const { serviceCenterId } = req.user;

    const { reservationIds, pickedUpByTechId } = req.body;

    const updatedReservations =
      await this.#componentReservationsService.pickupReservedComponents({
        reservationIds,
        serviceCenterId,
        pickedUpByTechId,
      });

    res.status(200).json({
      status: "success",
      data: {
        reservations: updatedReservations,
      },
    });
  };

  installComponent = async (req, res, next) => {
    const { reservationId } = req.params;
    const { serviceCenterId, userId } = req.user;

    const updatedComponent =
      await this.#componentReservationsService.installComponent({
        reservationId,
        serviceCenterId,
        installedByTechId: userId,
      });

    res.status(200).json({
      status: "success",
      data: {
        component: updatedComponent,
      },
    });
  };

  returnReservedComponent = async (req, res, next) => {
    const { reservationId } = req.params;
    const { serialNumber } = req.body;

    const result =
      await this.#componentReservationsService.returnReservedComponent({
        reservationId,
        serialNumber,
      });

    res.status(200).json({
      status: "success",
      data: {
        reservation: result.updatedReservation,
        component: result.updatedComponent,
      },
    });
  };
}

export default ComponentReservationsController;
