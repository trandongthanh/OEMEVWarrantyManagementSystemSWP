import { createContainer, asClass, Lifetime, asFunction } from "awilix";

import AuthController from "./src/api/controller/auth.controller.js";
import VehicleController from ".//src/api/controller/vehicle.controller.js";
import CustomerController from "./src/api/controller/customer.controller.js";
import VehicleProcessingRecordController from "./src/api/controller/vehicleProcessingRecord.controller.js";
import CaseLineController from "./src/api/controller/caseLine.controller.js";

import AuthService from "./src/service/auth.service.js";
import HashService from "./src/service/hash.service.js";
import TokenService from "./src/service/token.service.js";
import VehicleService from "./src/service/vehicle.service.js";
import ServiceCenterService from "./src/service/serviceCenter.service.js";
import CustomerService from "./src/service/customer.service.js";
import VehicleProcessingRecordService from "./src/service/vehicleProcessingRecord.service.js";
import WarehouseService from "./src/service/warehouse.service.js";
import CaseLineService from "./src/service/caseLine.service.js";

import UserRepository from "./src/repository/user.repository.js";
import VehicleRepository from "./src/repository/vehicle.repository.js";
import ServiceCenterRepository from "./src/repository/serviceCenter.repository.js";
import CustomerRepository from "./src/repository/customer.repository.js";
import VehicleProcessingRecordRepository from "./src/repository/vehicleProcessingRecord.repository.js";
import GuaranteeCaseRepository from "./src/repository/guaranteeCase.repository.js";
import WareHouseRepository from "./src/repository/warehouse.repository.js";
import ComponentReservationRepository from "./src/repository/componentReservation.repository.js";
import CaseLineRepository from "./src/repository/caseline.repository.js";

import { validateVehicleDatesWithDayjs } from "./src/util/validateVehicleDatesWithDayjs.js";
import TaskAssignment from "./src/models/TaskAssignment.cjs";
import TaskAssignmentRepository from "./src/repository/taskAssignment.repository.js";

const container = createContainer();

container.register({
  // Controllers
  authController: asClass(AuthController, { lifetime: Lifetime.SCOPED }),
  vehicleController: asClass(VehicleController, { lifetime: Lifetime.SCOPED }),
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

  // Repositories
  userRepository: asClass(UserRepository, { lifetime: Lifetime.SCOPED }),
  vehicleRepository: asClass(VehicleRepository, { lifetime: Lifetime.SCOPED }),
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
  wareHouseRepository: asClass(WareHouseRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  componentReservationRepository: asClass(ComponentReservationRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  caselineRepository: asClass(CaseLineRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  taskAssignemntRepository: asClass(TaskAssignmentRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  // Utils
  validateVehicleDatesWithDayjs: asFunction(
    () => validateVehicleDatesWithDayjs,
    { lifetime: Lifetime.SCOPED }
  ),
});

export default container;
