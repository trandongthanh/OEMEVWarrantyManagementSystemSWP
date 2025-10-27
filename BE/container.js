import { createContainer, asClass, Lifetime, asValue } from "awilix";

import AuthController from "./src/api/controller/auth.controller.js";
import VehicleController from ".//src/api/controller/vehicle.controller.js";
import CustomerController from "./src/api/controller/customer.controller.js";
import VehicleProcessingRecordController from "./src/api/controller/vehicleProcessingRecord.controller.js";
import CaseLineController from "./src/api/controller/caseLine.controller.js";
import WorkScheduleController from "./src/api/controller/workSchedule.controller.js";
import StockTransferRequestController from "./src/api/controller/stockTransferRequest.controller.js";

import AuthService from "./src/service/auth.service.js";
import HashService from "./src/service/hash.service.js";
import TokenService from "./src/service/token.service.js";
import VehicleService from "./src/service/vehicle.service.js";
import ServiceCenterService from "./src/service/serviceCenter.service.js";
import CustomerService from "./src/service/customer.service.js";
import VehicleProcessingRecordService from "./src/service/vehicleProcessingRecord.service.js";
import WarehouseService from "./src/service/warehouse.service.js";
import CaseLineService from "./src/service/caseLine.service.js";
import WorkScheduleService from "./src/service/workSchedule.service.js";
import StockTransferRequestService from "./src/service/stockTransferRequest.service.js";

import UserRepository from "./src/repository/user.repository.js";
import VehicleRepository from "./src/repository/vehicle.repository.js";
import ServiceCenterRepository from "./src/repository/serviceCenter.repository.js";
import CustomerRepository from "./src/repository/customer.repository.js";
import VehicleProcessingRecordRepository from "./src/repository/vehicleProcessingRecord.repository.js";
import GuaranteeCaseRepository from "./src/repository/guaranteeCase.repository.js";
import WareHouseRepository from "./src/repository/warehouse.repository.js";
import ComponentReservationRepository from "./src/repository/componentReservation.repository.js";
import CaseLineRepository from "./src/repository/caseline.repository.js";
import ComponentRepository from "./src/repository/component.repository.js";
import WorkScheduleRepository from "./src/repository/workSchedule.repository.js";

import StockTransferRequestRepository from "./src/repository/stockTransferRequest.repository.js";
import StockTransferRequestItemRepository from "./src/repository/stockTransferRequestItem.repository.js";
import StockReservationRepository from "./src/repository/stockReservation.repository.js";

import TaskAssignmentRepository from "./src/repository/taskAssignment.repository.js";
import UserController from "./src/api/controller/user.controller.js";
import UserService from "./src/service/user.service.js";
// import redisClient from "./src/util/redisClient.js";
import MailMessage from "nodemailer/lib/mailer/mail-message.js";
import transporter from "./src/util/emailTranporter.js";
import NotificationService from "./src/service/notification.service.js";
import ChatController from "./src/api/controller/chat.controller.js";
import ChatService from "./src/service/chat.service.js";
import GuestRepository from "./src/repository/guest.repository.js";
import ConversationRepository from "./src/repository/conversation.repository.js";
import MessageRepository from "./src/repository/message.repository.js";
import ComponentReservationsController from "./src/api/controller/componentReservations.controller.js";
import ComponentReservationService from "./src/service/componentReservation.service.js";
import WarehouseController from "./src/api/controller/warehouse.controller.js";
import TypeComponentRepository from "./src/repository/typeComponent.repository.js";

const container = createContainer();

export function setupContainer({ io, notificationNamespace, chatNamespace }) {
  container.register({
    //asValue
    io: asValue(io),
    notifications: asValue(notificationNamespace, {
      lifetime: Lifetime.SINGLETON,
    }),
    chats: asValue(chatNamespace, {
      lifetime: Lifetime.SINGLETON,
    }),
    // redisClient: asValue(redisClient, { lifetime: Lifetime.SCOPED }),
    transporter: asValue(transporter, { lifetime: Lifetime.SINGLETON }),

    // Controllers
    authController: asClass(AuthController, { lifetime: Lifetime.SCOPED }),
    vehicleController: asClass(VehicleController, {
      lifetime: Lifetime.SCOPED,
    }),
    customerController: asClass(CustomerController, {
      lifetime: Lifetime.SCOPED,
    }),
    vehicleProcessingRecordController: asClass(
      VehicleProcessingRecordController,
      { lifetime: Lifetime.SCOPED }
    ),
    caseLineController: asClass(CaseLineController, {
      lifetime: Lifetime.SCOPED,
    }),
    userController: asClass(UserController, { lifetime: Lifetime.SCOPED }),
    chatController: asClass(ChatController, { lifetime: Lifetime.SCOPED }),

    componentReservationsController: asClass(ComponentReservationsController, {
      lifetime: Lifetime.SCOPED,
    }),
    warehouseController: asClass(WarehouseController, {
      lifetime: Lifetime.SCOPED,
    }),
    workScheduleController: asClass(WorkScheduleController, {
      lifetime: Lifetime.SCOPED,
    }),
    stockTransferRequestController: asClass(StockTransferRequestController, {
      lifetime: Lifetime.SCOPED,
    }),

    // Services
    authService: asClass(AuthService, { lifetime: Lifetime.SCOPED }),
    hashService: asClass(HashService, { lifetime: Lifetime.SCOPED }),
    tokenService: asClass(TokenService, { lifetime: Lifetime.SCOPED }),
    vehicleService: asClass(VehicleService, { lifetime: Lifetime.SCOPED }),
    serviceCenterService: asClass(ServiceCenterService, {
      lifetime: Lifetime.SCOPED,
    }),
    customerService: asClass(CustomerService, { lifetime: Lifetime.SCOPED }),
    vehicleProcessingRecordService: asClass(VehicleProcessingRecordService, {
      lifetime: Lifetime.SCOPED,
    }),
    warehouseService: asClass(WarehouseService, { lifetime: Lifetime.SCOPED }),
    caseLineService: asClass(CaseLineService, { lifetime: Lifetime.SCOPED }),
    userService: asClass(UserService, { lifetime: Lifetime.SCOPED }),
    mailService: asClass(MailMessage, { lifetime: Lifetime.SCOPED }),
    notificationService: asClass(NotificationService, {
      lifetime: Lifetime.SCOPED,
    }),
    chatService: asClass(ChatService, { lifetime: Lifetime.SCOPED }),
    componentReservationsService: asClass(ComponentReservationService, {
      lifetime: Lifetime.SCOPED,
    }),
    workScheduleService: asClass(WorkScheduleService, {
      lifetime: Lifetime.SCOPED,
    }),
    stockTransferRequestService: asClass(StockTransferRequestService, {
      lifetime: Lifetime.SCOPED,
    }),

    // Repositories
    userRepository: asClass(UserRepository, { lifetime: Lifetime.SCOPED }),
    vehicleRepository: asClass(VehicleRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    serviceCenterRepository: asClass(ServiceCenterRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    customerRepository: asClass(CustomerRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    vehicleProcessingRecordRepository: asClass(
      VehicleProcessingRecordRepository,
      { lifetime: Lifetime.SCOPED }
    ),
    guaranteeCaseRepository: asClass(GuaranteeCaseRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    warehouseRepository: asClass(WareHouseRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    componentReservationRepository: asClass(ComponentReservationRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    caselineRepository: asClass(CaseLineRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    taskAssignmentRepository: asClass(TaskAssignmentRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    conversationRepository: asClass(ConversationRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    guestRepository: asClass(GuestRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    messageRepository: asClass(MessageRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    componentRepository: asClass(ComponentRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    typeComponentRepository: asClass(TypeComponentRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    stockTransferRequestRepository: asClass(StockTransferRequestRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    stockTransferRequestItemRepository: asClass(
      StockTransferRequestItemRepository,
      {
        lifetime: Lifetime.SCOPED,
      }
    ),
    stockReservationRepository: asClass(StockReservationRepository, {
      lifetime: Lifetime.SCOPED,
    }),
    workScheduleRepository: asClass(WorkScheduleRepository, {
      lifetime: Lifetime.SCOPED,
    }),
  });

  return container;
}

export default container;
