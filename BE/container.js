import { createContainer, asClass, Lifetime, asFunction } from "awilix";

import AuthService from "./src/service/auth.service.js";
import HashService from "./src/service/hash.service.js";
import TokenService from "./src/service/token.service.js";
import UserRepository from "./src/repository/user.repository.js";
import AuthController from "./src/controller/auth.controller.js";
import VehicleService from "./src/service/vehicle.service.js";
import VehicleController from "./src/controller/vehicle.controller.js";
import VehicleRepository from "./src/repository/vehicle.repository.js";
import ServiceCenterRepository from "./src/repository/serviceCenter.repository.js";
import ServiceCenterService from "./src/service/serviceCenter.service.js";
import CustomerRepository from "./src/repository/customer.repository.js";
import CustomerService from "./src/service/customer.service.js";
import { validateVehicleDatesWithDayjs } from "./src/util/validateVehicleDatesWithDayjs.js";
import CustomerController from "./src/controller/customer.controller.js";
import VehicleProcessingRecordRepository from "./src/repository/vehicleProcessingRecord.repository.js";
import GuaranteeCaseRepository from "./src/repository/guaranteeCase.repository.js";
import VehicleProcessingRecordController from "./src/controller/vehicleProcessingRecord.controller.js";
import VehicleProcessingRecordService from "./src/service/vehicleProcessingRecord.service.js";
import WareHouseRepository from "./src/repository/warehouse.repository.js";
import WarehouseService from "./src/service/warehouse.service.js";

const container = createContainer();

container.register({
  userRepository: asClass(UserRepository, { lifetime: Lifetime.SINGLETON }),

  hashService: asClass(HashService, { lifetime: Lifetime.SINGLETON }),

  tokenService: asClass(TokenService, { lifetime: Lifetime.SINGLETON }),

  authService: asClass(AuthService, { lifetime: Lifetime.SINGLETON }),

  authController: asClass(AuthController, { lifetime: Lifetime.SINGLETON }),

  vehicleRepository: asClass(VehicleRepository, {
    lifetime: Lifetime.SINGLETON,
  }),

  vehicleService: asClass(VehicleService, { lifetime: Lifetime.SINGLETON }),

  vehicleController: asClass(VehicleController, {
    lifetime: Lifetime.SINGLETON,
  }),

  serviceCenterRepository: asClass(ServiceCenterRepository, {
    lifetime: Lifetime.SINGLETON,
  }),

  serviceCenterService: asClass(ServiceCenterService, {
    lifetime: Lifetime.SINGLETON,
  }),

  customerRepository: asClass(CustomerRepository, {
    lifetime: Lifetime.SINGLETON,
  }),

  customerService: asClass(CustomerService, {
    lifetime: Lifetime.SINGLETON,
  }),

  customerController: asClass(CustomerController, {
    lifetime: Lifetime.SINGLETON,
  }),

  vehicleProcessingRecordRepository: asClass(
    VehicleProcessingRecordRepository,
    {
      lifetime: Lifetime.SINGLETON,
    }
  ),

  vehicleProcessingRecordController: asClass(
    VehicleProcessingRecordController,
    {
      lifetime: Lifetime.SINGLETON,
    }
  ),

  vehicleProcessingRecordService: asClass(VehicleProcessingRecordService, {
    lifetime: Lifetime.SINGLETON,
  }),

  guaranteeCaseRepository: asClass(GuaranteeCaseRepository, {
    lifetime: Lifetime.SINGLETON,
  }),

  warehouseRepository: asClass(WareHouseRepository, {
    lifetime: Lifetime.SINGLETON,
  }),

  warehouseService: asClass(WarehouseService, {
    lifetime: Lifetime.SINGLETON,
  }),

  validateVehicleDatesWithDayjs: asFunction(
    () => validateVehicleDatesWithDayjs,
    {
      lifetime: Lifetime.SINGLETON,
    }
  ),
});

export default container;
