import db from "../models/index.cjs";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../error/index.js";

import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";
import { Transaction } from "sequelize";
import dayjs from "dayjs";

class VehicleProcessingRecordService {
  #notificationService;
  #vehicleProcessingRecordRepository;
  #guaranteeCaseRepository;
  #vehicleRepository;
  #taskAssignmentRepository;
  #userRepository;

  constructor({
    vehicleProcessingRecordRepository,
    guaranteeCaseRepository,
    vehicleRepository,
    notificationService,
    userRepository,
    taskAssignmentRepository,
  }) {
    this.#vehicleProcessingRecordRepository = vehicleProcessingRecordRepository;
    this.#guaranteeCaseRepository = guaranteeCaseRepository;
    this.#vehicleRepository = vehicleRepository;
    this.#taskAssignmentRepository = taskAssignmentRepository;
    this.#notificationService = notificationService;
    this.#userRepository = userRepository;
  }

  createRecord = async ({
    vin,
    odometer,
    guaranteeCases,
    visitorInfo,
    createdByStaffId,
    serviceCenterId,
    companyId,
  }) => {
    if (!createdByStaffId || !companyId) {
      throw new ForbiddenError("You don't have permission to create record");
    }

    const rawResult = await db.sequelize.transaction(async (t) => {
      const existingVehicle = await this.#vehicleRepository.findByVinAndCompany(
        {
          vin: vin,
          companyId: companyId,
        },
        t,
        Transaction.LOCK.SHARE
      );

      if (!existingVehicle) {
        throw new NotFoundError(`Cannot find vehicle with ${vin}`);
      }

      if (!existingVehicle?.owner) {
        throw new NotFoundError(
          `Vehicle with ${vin} does not have an owner, cannot create a record`
        );
      }

      const existingRecord =
        await this.#vehicleProcessingRecordRepository.findRecordIsNotCompleted(
          {
            vin: vin,
          },
          t,
          Transaction.LOCK.SHARE
        );

      if (existingRecord) {
        throw new ConflictError("Vehicle already has an active record");
      }

      const newRecord =
        await this.#vehicleProcessingRecordRepository.createRecord(
          {
            odometer,
            createdByStaffId,
            vin,
            visitorInfo,
            checkInDate: dayjs(),
          },
          t
        );

      if (!newRecord) {
        throw new Error("Failed to create vehicle processing record");
      }

      const dataGuaranteeCaseToCreate = guaranteeCases.map((guaranteeCase) => {
        return {
          ...guaranteeCase,
          vehicleProcessingRecordId: newRecord?.vehicleProcessingRecordId,
        };
      });

      const newGuaranteeCases =
        await this.#guaranteeCaseRepository.createGuaranteeCases(
          {
            guaranteeCases: dataGuaranteeCaseToCreate,
          },
          t
        );

      if (!newGuaranteeCases || newGuaranteeCases.length === 0) {
        throw new Error("Failed to create guarantee cases");
      }

      return { newRecord, newGuaranteeCases };
    });

    const { newRecord, newGuaranteeCases } = rawResult;

    const formatGuaranteeCases = newGuaranteeCases.map((guaranteeCase) => {
      return {
        ...guaranteeCase,
        createdAt: formatUTCtzHCM(newRecord?.createdAt),
      };
    });

    const formattedRecord = {
      ...newRecord,
      createdAt: formatUTCtzHCM(newRecord?.createdAt),

      guaranteeCases: formatGuaranteeCases,
    };

    const room = `service_center_manager_${serviceCenterId}`;
    const event = "new_record_notification";
    const payload = {
      message: "A new vehicle processing record has been created",
      record: formattedRecord,
      room: room,
      sendAt: dayjs(),
    };

    this.#notificationService.sendToRoom(room, event, payload);

    return formattedRecord;
  };

  updateMainTechnician = async ({
    vehicleProcessingRecordId,
    technicianId,
    serviceCenterId,
  }) => {
    let oldTechnicianId = null;

    const rawResult = await db.sequelize.transaction(async (t) => {
      await this.#canAssignTask({
        serviceCenterId: serviceCenterId,
        technicianId: technicianId,
        vehicleProcessingRecordId: vehicleProcessingRecordId,
        transaction: t,
        lock: Transaction.LOCK.UPDATE,
      });

      const existingRecord =
        await this.#vehicleProcessingRecordRepository.findDetailById(
          { id: vehicleProcessingRecordId },
          t,
          Transaction.LOCK.UPDATE
        );

      if (!existingRecord) {
        throw new NotFoundError("Record not found.");
      }

      oldTechnicianId = existingRecord?.mainTechnician?.userId;

      const guaranteeCaseIds = existingRecord?.guaranteeCases.map(
        (gc) => gc?.guaranteeCaseId
      );

      if (oldTechnicianId !== technicianId && oldTechnicianId) {
        const affectedRows =
          await this.#taskAssignmentRepository.cancelAssignmentsByGuaranteeCaseIds(
            {
              guaranteeCaseIds: guaranteeCaseIds,
            },
            t
          );

        if (affectedRows === 0) {
          throw new Error("No assignments were cancelled");
        }
      }

      const [updatedRecord, updatedGuaranteeCases, newTaskAssignments] =
        await Promise.all([
          this.#vehicleProcessingRecordRepository.updateMainTechnician(
            {
              vehicleProcessingRecordId: vehicleProcessingRecordId,
              technicianId: technicianId,
            },
            t
          ),

          this.#guaranteeCaseRepository.updateMainTechnician(
            {
              vehicleProcessingRecordId: vehicleProcessingRecordId,
              technicianId: technicianId,
            },
            t
          ),

          this.#taskAssignmentRepository.bulkCreateTaskAssignments(
            { guaranteeCaseIds: guaranteeCaseIds, technicianId: technicianId },
            t
          ),
        ]);

      return { updatedRecord, updatedGuaranteeCases, newTaskAssignments };
    });

    const { updatedRecord, updatedGuaranteeCases, newTaskAssignments } =
      rawResult;

    if (updatedRecord === 0) {
      throw new NotFoundError("Record not found or not updated.");
    }

    if (updatedGuaranteeCases === 0) {
      throw new Error("Guarantee cases were not updated.");
    }

    const formatUpdatedRecord = {
      recordId: updatedRecord?.vehicleProcessingRecordId,
      vin: updatedRecord?.vin,
      status: updatedRecord?.status,
      technician: updatedRecord?.mainTechnician,
      updatedCases: updatedGuaranteeCases.map((guaranteeCase) => ({
        caseId: guaranteeCase?.guaranteeCaseId,
        status: guaranteeCase?.status,
        leadTech: guaranteeCase?.leadTechId,
      })),
      assignments: newTaskAssignments.map((assignment) => ({
        assignmentId: assignment?.taskAssignmentId,
        guaranteeCaseId: assignment?.guaranteeCaseId,
        technicianId: assignment?.technicianId,
        taskType: assignment?.taskType,
        assignedAt: formatUTCtzHCM(assignment?.assignedAt),
      })),
    };

    if (oldTechnicianId && oldTechnicianId !== technicianId) {
      const oldTechRoom = `user_${oldTechnicianId}`;
      const unassignPayload = {
        message: "You have been unassigned from tasks.",
        recordId: updatedRecord?.vehicleProcessingRecordId,
        vin: updatedRecord?.vin,
        reason: "Reassigned to another technician",
        timestamp: formatUTCtzHCM(dayjs()),
        room: oldTechRoom,
      };

      this.#notificationService.sendToRoom(
        oldTechRoom,
        "task_unassigned_notification",
        unassignPayload
      );
    }

    const room = `user_${technicianId}`;
    const event = "new_task_assignment_notification";
    const payload = {
      message: "You have been assigned new tasks.",
      assignmentDetails: formatUpdatedRecord,
      timestamp: dayjs(),
      room: room,
    };

    this.#notificationService.sendToRoom(room, event, payload);

    return formatUpdatedRecord;
  };

  findDetailById = async ({ id, userId, serviceCenterId }) => {
    if (!id) {
      throw new BadRequestError("RecordId is required");
    }

    const record = await this.#vehicleProcessingRecordRepository.findDetailById(
      { id }
    );

    if (!record) {
      throw new NotFoundError("Record not found");
    }

    const hasPermission =
      record.createdByStaff?.userId === userId ||
      record.mainTechnician?.userId === userId ||
      record.createdByStaff?.serviceCenterId === serviceCenterId;

    if (!hasPermission) {
      throw new ForbiddenError(
        "You do not have permission to view this record"
      );
    }

    return record;
  };

  getAllRecords = async ({
    serviceCenterId,
    userId,
    roleName,
    page,
    limit,
    status,
  }) => {
    if (!serviceCenterId) {
      throw new BadRequestError("serviceCenterId is required");
    }

    const offset = (page - 1) * limit;

    const limitNumber = parseInt(limit);
    const offsetNumber = parseInt(offset);

    const records = await this.#vehicleProcessingRecordRepository.findAll({
      serviceCenterId: serviceCenterId,
      limit: limitNumber,
      offset: offsetNumber,
      status: status,
      userId: userId,
      roleName: roleName,
    });

    if (!records || records.length === 0) {
      return [];
    }

    return records;
  };

  #canAssignTask = async ({
    serviceCenterId: managerServiceCenterId,
    technicianId,
    vehicleProcessingRecordId,
    transaction = null,
    lock = null,
  }) => {
    const [record, technician] = await Promise.all([
      this.#vehicleProcessingRecordRepository.findDetailById(
        { id: vehicleProcessingRecordId },
        transaction,
        lock
      ),

      this.#userRepository.findUserById(
        { userId: technicianId },
        transaction,
        lock
      ),
    ]);

    if (!record) {
      throw new NotFoundError("Record not found.");
    }

    if (!technician) {
      throw new NotFoundError(`Technician with ID: ${technicianId} not found.`);
    }

    const ASSIGNABLE_STATUSES = ["CHECKED_IN", "IN_DIAGNOSIS"];

    if (!ASSIGNABLE_STATUSES.includes(record.status)) {
      throw new ForbiddenError(
        "Task can only be assigned to checked-in records or records in diagnosis."
      );
    }

    if (technician.role?.roleName !== "service_center_technician") {
      throw new ForbiddenError(
        "Assigned user must have role service_center_technician"
      );
    }

    if (record.createdByStaff?.serviceCenterId !== managerServiceCenterId) {
      throw new ForbiddenError(
        "You can only assign tasks for records in your own service center."
      );
    }

    if (technician.serviceCenterId !== managerServiceCenterId) {
      throw new ForbiddenError(
        "You can only assign technicians from your own service center."
      );
    }
  };
}

export default VehicleProcessingRecordService;
