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
  #caselineRepository;
  #workScheduleRepository;

  constructor({
    vehicleProcessingRecordRepository,
    guaranteeCaseRepository,
    vehicleRepository,
    notificationService,
    userRepository,
    taskAssignmentRepository,
    caselineRepository,
    workScheduleRepository,
  }) {
    this.#vehicleProcessingRecordRepository = vehicleProcessingRecordRepository;
    this.#guaranteeCaseRepository = guaranteeCaseRepository;
    this.#vehicleRepository = vehicleRepository;
    this.#taskAssignmentRepository = taskAssignmentRepository;
    this.#notificationService = notificationService;
    this.#userRepository = userRepository;
    this.#caselineRepository = caselineRepository;
    this.#workScheduleRepository = workScheduleRepository;
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
    roleName,
    userId,
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
          {
            id: vehicleProcessingRecordId,
            roleName,
            userId,
            serviceCenterId: serviceCenterId,
          },
          t,
          Transaction.LOCK.UPDATE
        );

      if (!existingRecord) {
        throw new NotFoundError("Record not found.");
      }

      oldTechnicianId = existingRecord?.mainTechnician?.userId;

      if (oldTechnicianId === technicianId) {
        throw new ConflictError(
          "Technician is already assigned to this record as main technician"
        );
      }

      const guaranteeCaseIds = existingRecord?.guaranteeCases.map(
        (gc) => gc?.guaranteeCaseId
      );

      const schedule = await this.#workScheduleRepository.getMySchedule({
        technicianId: technicianId,
        workDate: dayjs().format("YYYY-MM-DD"),
      });

      if (!schedule) {
        throw new ConflictError(
          "Technician does not have a work schedule for today. Please create a schedule first."
        );
      }

      if (schedule.status !== "AVAILABLE") {
        throw new ConflictError(
          `Technician is not available on the work date. Current status: ${schedule.status}`
        );
      }

      if (oldTechnicianId && oldTechnicianId !== technicianId) {
        const affectedRows =
          await this.#taskAssignmentRepository.cancelAssignmentsByGuaranteeCaseIds(
            {
              guaranteeCaseIds: guaranteeCaseIds,
            },
            t
          );

        if (affectedRows === 0) {
          throw new ConflictError(
            `No active assignments found for old technician ${oldTechnicianId}. Data may be inconsistent or assignments were already cancelled.`
          );
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

    if (!newTaskAssignments || newTaskAssignments.length === 0) {
      throw new Error(
        "Failed to create task assignments for the technician. Please try again."
      );
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

  findDetailById = async ({ id, userId, roleName, serviceCenterId }) => {
    if (!id) {
      throw new BadRequestError("RecordId is required");
    }

    const record = await this.#vehicleProcessingRecordRepository.findDetailById(
      {
        id,
        roleName,
        userId,
        serviceCenterId,
      }
    );

    if (!record) {
      throw new NotFoundError("Record not found");
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

  completeRecord = async ({ vehicleProcessingRecordId }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const record = await this.#vehicleProcessingRecordRepository.findByPk(
        vehicleProcessingRecordId,
        transaction,
        Transaction.LOCK.UPDATE
      );

      if (!record) {
        throw new NotFoundError(
          `Processing record with ID ${vehicleProcessingRecordId} not found`
        );
      }

      const validStatuses = ["READY_FOR_PICKUP"];
      if (!validStatuses.includes(record.status)) {
        throw new ConflictError(
          `Cannot complete record with status ${
            record.status
          }. Record must be in one of these statuses: ${validStatuses.join(
            ", "
          )}`
        );
      }

      const guaranteeCases = await this.#guaranteeCaseRepository.findByRecordId(
        { vehicleProcessingRecordId },
        transaction
      );

      if (!guaranteeCases || guaranteeCases.length === 0) {
        throw new NotFoundError("No guarantee cases found for this record");
      }

      for (const gc of guaranteeCases) {
        if (gc.status !== "DIAGNOSED") {
          throw new ConflictError(
            `Cannot complete record because guarantee case with ID ${gc.guaranteeCaseId} is in status ${gc.status}. All guarantee cases must be DIAGNOSED before completing the record.`
          );
        }
      }

      const allCaseLines =
        await this.#caselineRepository.findByProcessingRecordId(
          { vehicleProcessingRecordId },
          transaction,
          Transaction.LOCK.UPDATE
        );

      for (const caseLine of allCaseLines) {
        if (
          caseLine.status !== "COMPLETED" &&
          caseLine.status !== "CANCELLED"
        ) {
          throw new ConflictError(
            `Cannot complete record because case line with ID ${caseLine.id} is in status ${caseLine.status}. All case lines must be COMPLETED or CANCELLED before completing the record.`
          );
        }
      }

      const completedRecord =
        await this.#vehicleProcessingRecordRepository.completeRecord(
          {
            vehicleProcessingRecordId,
            status: "COMPLETED",
            checkOutDate: formatUTCtzHCM(dayjs()),
          },
          transaction
        );

      return completedRecord;
    });

    return rawResult;
  };

  makeDiagnosisCompleted = async ({
    userId,
    roleName,
    serviceCenterId,
    vehicleProcessingRecordId,
  }) => {
    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const vehicleProcessingRecord =
        await this.#vehicleProcessingRecordRepository.findDetailById(
          {
            id: vehicleProcessingRecordId,
            roleName,
            userId,
            serviceCenterId: serviceCenterId,
          },
          transaction,
          Transaction.LOCK.UPDATE
        );

      if (!vehicleProcessingRecord) {
        throw new NotFoundError("Vehicle processing record not found");
      }

      const guaranteeCases = vehicleProcessingRecord?.guaranteeCases || [];

      for (const guaranteeCase of guaranteeCases) {
        if (guaranteeCase.status !== "IN_DIAGNOSIS") {
          throw new BadRequestError("Guarantee case is not in diagnosis");
        }

        const caseLines = guaranteeCase.caseLines || [];

        for (const caseLine of caseLines) {
          if (
            caseLine.status !== "DRAFT" ||
            caseLine.status !== "REJECTED_BY_OUT_OF_WARRANTY" ||
            caseLine.status !== "REJECTED_BY_TECH"
          ) {
            throw new BadRequestError("Case line is not in diagnosable status");
          }
        }
      }

      const updatedRecord =
        await this.#vehicleProcessingRecordRepository.updateStatus(
          {
            vehicleProcessingRecordId: vehicleProcessingRecordId,
            status: "WAITING_CUSTOMER_APPROVAL",
          },
          transaction
        );

      const updatedGuaranteeCases = [];

      let caseLineIds = [];
      for (const guaranteeCase of guaranteeCases) {
        const updatedCase = await this.#guaranteeCaseRepository.updateStatus(
          {
            guaranteeCaseId: guaranteeCase.guaranteeCaseId,
            status: "DIAGNOSED",
          },
          transaction
        );

        updatedGuaranteeCases.push(updatedCase);

        for (const caseLine of guaranteeCase.caseLines) {
          caseLineIds.push(caseLine.id);
        }
      }

      const updatedCaseLines =
        await this.#caselineRepository.bulkUpdateStatusByIds(
          { caseLineIds: caseLineIds, status: "PENDING_APPROVAL" },
          transaction
        );

      const record =
        await this.#vehicleProcessingRecordRepository.findDetailById(
          {
            id: vehicleProcessingRecordId,
            roleName,
            userId,
            serviceCenterId,
          },
          transaction
        );

      const roomName = `service_center_staff_${serviceCenterId}`;
      const eventName = "vehicleProcessingRecordStatusUpdated";
      const data = {
        roomName,
        record,
      };

      await this.#notificationService.sendToRoom(roomName, eventName, data);

      return { record, updatedGuaranteeCases, updatedCaseLines };
    });

    return {
      record: rawResult.record,
      updatedGuaranteeCases: rawResult.updatedGuaranteeCases,
      updatedCaseLines: rawResult.updatedCaseLines,
    };
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
        {
          id: vehicleProcessingRecordId,
          serviceCenterId: managerServiceCenterId,
        },
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

  getServiceHistory = async ({ vin, companyId, page, limit, statusFilter }) => {
    const offset = (page - 1) * limit;

    const rawResult = await db.sequelize.transaction(async (transaction) => {
      const vehicle = await this.#vehicleRepository.findByVinAndCompany({
        vin: vin,
        companyId: companyId,
      });

      if (!vehicle) {
        throw new NotFoundError("Vehicle not found");
      }

      const recorsdsByVin =
        await this.#vehicleProcessingRecordRepository.getServiceHistoryByVin(
          {
            vin: vin,
            statusFilter,
            limit,
            offset,
          },
          transaction
        );

      return { recorsdsByVin, vehicle };
    });

    const { vehicle, recorsdsByVin } = rawResult;

    const formatResult = {
      vehicle: vehicle,
      serviceHistory: recorsdsByVin.map((record) => ({
        ...record,
        createdAt: formatUTCtzHCM(record?.createdAt),
        checkInDate: formatUTCtzHCM(record?.checkInDate),
        checkOutDate: record?.checkOutDate
          ? formatUTCtzHCM(record?.checkOutDate)
          : null,
      })),
    };

    return formatResult;
  };
}

export default VehicleProcessingRecordService;
