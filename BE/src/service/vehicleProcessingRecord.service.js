import db from "../models/index.cjs";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../error/index.js";

import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";

class VehicleProcessingRecordService {
  constructor({
    vehicleProcessingRecordRepository,
    guaranteeCaseRepository,
    vehicleRepository,
    serviceCenterService,
    customerService,
    taskAssignemntRepository,
  }) {
    this.vehicleProcessingRecordRepository = vehicleProcessingRecordRepository;
    this.guaranteeCaseRepository = guaranteeCaseRepository;
    this.vehicleRepository = vehicleRepository;
    this.serviceCenterService = serviceCenterService;
    this.customerService = customerService;
    this.taskAssignemntRepository = taskAssignemntRepository;
  }

  createRecord = async ({
    odometer,
    createdByStaffId,
    vin,
    guaranteeCases,
    companyId,
  }) => {
    if (!odometer || !createdByStaffId || !vin) {
      throw new Error(
        "Missing required fields to create vehicle processing record"
      );
    }

    if (
      !guaranteeCases ||
      !Array.isArray(guaranteeCases) ||
      guaranteeCases.length <= 0
    ) {
      throw new BadRequestError("At least one guarantee case is required.");
    }

    for (const caseItem of guaranteeCases) {
      if (!caseItem.contentGuarantee) {
        throw new BadRequestError("Guaranteecase must provide content");
      }
    }

    if (odometer < 0) {
      throw new Error("Odometer cannot be negative");
    }

    return await db.sequelize.transaction(async (t) => {
      const existingVehicle =
        await this.vehicleRepository.findByVinAndCompanyWithOwner(
          {
            vin: vin,
            companyId: companyId,
          },
          t
        );

      if (!existingVehicle) {
        throw new NotFoundError(`Cannot find vehicle with ${vin}`);
      }

      if (!existingVehicle.owner) {
        throw new NotFoundError(
          `Vehicle with ${vin} does not have an owner, cannot create a record`
        );
      }

      const existingRecord =
        await this.vehicleProcessingRecordRepository.findRecordIsNotCompleted({
          vin: vin,
        });

      if (existingRecord) {
        throw new ConflictError("Vehicle already has an active record");
      }

      const newRecord =
        await this.vehicleProcessingRecordRepository.createRecord(
          {
            odometer,
            createdByStaffId,
            vin,
          },
          t
        );

      const guaranteeCasesWithRecordId = guaranteeCases.map((guaranteeCase) => {
        return {
          ...guaranteeCase,
          vehicleProcessingRecordId: newRecord.vehicleProcessingRecordId,
        };
      });

      const newGuaranteeCases =
        await this.guaranteeCaseRepository.createGuaranteeCases(
          {
            guaranteeCases: guaranteeCasesWithRecordId,
          },
          t
        );

      const formatGuaranteeCases = newGuaranteeCases.map((guaranteeCase) => {
        return {
          ...guaranteeCase,
          openedAt: formatUTCtzHCM(newRecord.openedAt),
          createdAt: formatUTCtzHCM(newRecord.createdAt),
          updatedAt: formatUTCtzHCM(newRecord.updatedAt),
        };
      });

      return {
        record: {
          ...newRecord,
          openedAt: formatUTCtzHCM(newRecord.openedAt),
          createdAt: formatUTCtzHCM(newRecord.createdAt),
          updatedAt: formatUTCtzHCM(newRecord.updatedAt),
          case: formatGuaranteeCases,
        },
      };
    });
  };

  updateMainTechnician = async ({
    vehicleProcessingRecordId,
    technicianId,
  }) => {
    // if (!vehicleProcessingRecordId || !technicianId) {
    //   throw new BadRequestError(
    //     "vehicleProcessingRecordId, technicianId is required"
    //   );
    // }

    return await db.sequelize.transaction(async (t) => {
      const updatedRecord =
        await this.vehicleProcessingRecordRepository.updateMainTechnician(
          {
            vehicleProcessingRecordId: vehicleProcessingRecordId,
            technicianId: technicianId,
          },
          t
        );

      const updatedGuaranteeCases =
        await this.guaranteeCaseRepository.updateMainTechnician(
          {
            vehicleProcessingRecordId: vehicleProcessingRecordId,
            technicianId: technicianId,
          },
          t
        );
      const updatedGuaranteeCaseIds = updatedGuaranteeCases.map(
        (item) => item.guaranteeCaseId
      );

      const newTaskAssignments =
        await this.taskAssignemntRepository.bulkCreateTaskAssignments(
          {
            guaranteeCaseIds: updatedGuaranteeCaseIds,
            technicianId: technicianId,
          },
          t
        );

      const formatUpdatedRecord = {
        recordId: updatedRecord?.vehicleProcessingRecordId,
        vin: updatedRecord?.vin,
        status: updatedRecord?.status,
        technician: updatedRecord?.mainTechnician,
        updatedCases: updatedGuaranteeCases.map((guaranteeCase) => ({
          caseId: guaranteeCase?.guaranteeCaseId,
          status: guaranteeCase?.status,
          leadTech: guaranteeCase?.leadTechnicianCases,
        })),
        assignments: newTaskAssignments.map((assignment) => ({
          assignmentId: assignment?.taskAssignmentId,
          guaranteeCaseId: assignment?.guaranteeCaseId,
          technicianId: assignment?.technicianId,
          taskType: assignment?.taskType,
          assignedAt: formatUTCtzHCM(assignment?.assignedAt),
        })),
      };

      return formatUpdatedRecord;
    });
  };

  findById = async ({ id, userId }) => {
    if (!id || !userId) {
      throw new BadRequestError("RecordId and userId is required");
    }

    const record = await this.vehicleProcessingRecordRepository.findById({
      id: id,
    });

    const isOwner = record?.createdByStaff?.userId === userId;
    const isMainTechnician = record?.mainTechnician?.userId === userId;

    if (!isOwner && !isMainTechnician) {
      throw new ForbiddenError(
        "You do not have permission to view this record"
      );
    }

    return record;
  };
}

export default VehicleProcessingRecordService;
