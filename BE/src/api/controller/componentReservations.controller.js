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
        sortBy,
        sortOrder,
        serviceCenterId,
      });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  pickupReservedComponent = async (req, res, next) => {
    const { reservationId } = req.params;

    const { serviceCenterId } = req.user;

    const { pickedUpByTechId } = req.body;

    const updatedReservation =
      await this.#componentReservationsService.pickupReservedComponent({
        reservationId,
        serviceCenterId,
        pickedUpByTechId: pickedUpByTechId,
      });

    res.status(200).json({
      status: "success",
      data: {
        reservation: updatedReservation,
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
