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
    const { reservationIds, pickedUpByTechId } = req.body;

    const updatedReservations =
      await this.#componentReservationsService.pickupReservedComponents({
        reservationIds,
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

    const updatedComponent =
      await this.#componentReservationsService.installComponent({
        reservationId,
      });

    res.status(200).json({
      status: "success",
      data: {
        component: updatedComponent,
      },
    });
  };
}

export default ComponentReservationsController;
