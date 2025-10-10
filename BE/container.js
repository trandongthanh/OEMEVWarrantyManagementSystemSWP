import { createContainer, asClass, Lifetime, asFunction } from "awilix";

import AuthService from "./src/service/auth.service.js";
import HashService from "./src/service/hash.service.js";
import TokenService from "./src/service/token.service.js";
import UserRepository from "./src/repository/user.repository.js";
import AuthController from "./src/api/controller/auth.controller.js";
import VehicleService from "./src/service/vehicle.service.js";
import VehicleController from ".//src/api/controller/vehicle.controller.js";
import VehicleRepository from "./src/repository/vehicle.repository.js";
import ServiceCenterRepository from "./src/repository/serviceCenter.repository.js";
import ServiceCenterService from "./src/service/serviceCenter.service.js";
import CustomerRepository from "./src/repository/customer.repository.js";
import CustomerService from "./src/service/customer.service.js";
import { validateVehicleDatesWithDayjs } from "./src/util/validateVehicleDatesWithDayjs.js";
import CustomerController from "./src/api/controller/customer.controller.js";
import VehicleProcessingRecordRepository from "./src/repository/vehicleProcessingRecord.repository.js";
import GuaranteeCaseRepository from "./src/repository/guaranteeCase.repository.js";
import VehicleProcessingRecordController from "./src/api/controller/vehicleProcessingRecord.controller.js";
import VehicleProcessingRecordService from "./src/service/vehicleProcessingRecord.service.js";
import WareHouseRepository from "./src/repository/warehouse.repository.js";
import WarehouseService from "./src/service/warehouse.service.js";

const container = createContainer();

container.register({
  userRepository: asClass(UserRepository, { lifetime: Lifetime.SCOPED }),

  hashService: asClass(HashService, { lifetime: Lifetime.SCOPED }),

  tokenService: asClass(TokenService, { lifetime: Lifetime.SCOPED }),

  authService: asClass(AuthService, { lifetime: Lifetime.SCOPED }),

  authController: asClass(AuthController, { lifetime: Lifetime.SCOPED }),

  vehicleRepository: asClass(VehicleRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  vehicleService: asClass(VehicleService, { lifetime: Lifetime.SCOPED }),

  vehicleController: asClass(VehicleController, {
    lifetime: Lifetime.SCOPED,
  }),

  serviceCenterRepository: asClass(ServiceCenterRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  serviceCenterService: asClass(ServiceCenterService, {
    lifetime: Lifetime.SCOPED,
  }),

  customerRepository: asClass(CustomerRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  customerService: asClass(CustomerService, {
    lifetime: Lifetime.SCOPED,
  }),

  customerController: asClass(CustomerController, {
    lifetime: Lifetime.SCOPED,
  }),

  vehicleProcessingRecordRepository: asClass(
    VehicleProcessingRecordRepository,
    {
      lifetime: Lifetime.SCOPED,
    }
  ),

  vehicleProcessingRecordController: asClass(
    VehicleProcessingRecordController,
    {
      lifetime: Lifetime.SCOPED,
    }
  ),

  vehicleProcessingRecordService: asClass(VehicleProcessingRecordService, {
    lifetime: Lifetime.SCOPED,
  }),

  guaranteeCaseRepository: asClass(GuaranteeCaseRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  warehouseRepository: asClass(WareHouseRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  warehouseService: asClass(WarehouseService, {
    lifetime: Lifetime.SCOPED,
  }),

  validateVehicleDatesWithDayjs: asFunction(
    () => validateVehicleDatesWithDayjs,
    {
      lifetime: Lifetime.SCOPED,
    }
  ),
});

export default container;
