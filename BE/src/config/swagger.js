import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OEM EV Warranty Management System API",
      version: "1.0.0",
      description:
        "API documentation for OEM EV Warranty Management System - Hệ thống quản lý bảo hành xe điện",
      contact: {
        name: "API Support",
        email: "support@oemevwarranty.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development server",
      },
      {
        url: "https://api.oemevwarranty.com/api/v1",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token obtained from /auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              type: "object",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              format: "uuid",
              example: "fc46ac80-7339-470e-ae22-4757c37a1af0",
            },
            userName: {
              type: "string",
              example: "staff_hn1",
            },
            name: {
              type: "string",
              example: "Nguyễn Văn An",
            },
            email: {
              type: "string",
              format: "email",
              example: "staff.hn1@vinfast.vn",
            },
            phone: {
              type: "string",
              example: "0912345678",
            },
            address: {
              type: "string",
              example: "Hà Nội",
            },
            roleId: {
              type: "string",
              format: "uuid",
            },
            serviceCenterId: {
              type: "string",
              format: "uuid",
            },
            vehicleCompanyId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            vin: {
              type: "string",
              description: "Vehicle Identification Number",
              example: "VFE34TEST00000001",
            },
            licensePlate: {
              type: "string",
              example: "30A-12345",
            },
            dateOfManufacture: {
              type: "string",
              format: "date",
            },
            placeOfManufacture: {
              type: "string",
              example: "Hải Phòng",
            },
            purchaseDate: {
              type: "string",
              format: "date",
            },
            ownerId: {
              type: "string",
              format: "uuid",
            },
            vehicleModelId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        Customer: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            fullName: {
              type: "string",
              example: "Nguyễn Văn A",
            },
            email: {
              type: "string",
              format: "email",
              example: "customer@example.com",
            },
            phone: {
              type: "string",
              example: "0987654321",
            },
            address: {
              type: "string",
              example: "123 Đường ABC, Quận 1, TP.HCM",
            },
          },
        },
        Component: {
          type: "object",
          properties: {
            componentId: {
              type: "string",
              format: "uuid",
            },
            serialNumber: {
              type: "string",
              example: "BMS-CTRL-01-SN0128",
            },
            typeComponentId: {
              type: "string",
              format: "uuid",
            },
            warehouseId: {
              type: "string",
              format: "uuid",
            },
            status: {
              type: "string",
              enum: [
                "IN_STOCK",
                "RESERVED",
                "INSTALLED",
                "RETURNED",
                "DEFECTIVE",
              ],
            },
            vehicleVin: {
              type: "string",
            },
            installedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        TypeComponent: {
          type: "object",
          properties: {
            typeComponentId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Màn Hình LCD 12 inch",
            },
            category: {
              type: "string",
              enum: [
                "HIGH_VOLTAGE_BATTERY",
                "POWERTRAIN",
                "CHARGING_SYSTEM",
                "THERMAL_MANAGEMENT",
                "LOW_VOLTAGE_SYSTEM",
                "BRAKING",
                "SUSPENSION_STEERING",
                "HVAC",
                "BODY_CHASSIS",
                "INFOTAINMENT_ADAS",
              ],
            },
            price: {
              type: "number",
              example: 5000000,
            },
            sku: {
              type: "string",
              example: "LCD-12-VF34",
            },
          },
        },
        VehicleProcessingRecord: {
          type: "object",
          properties: {
            vehicleProcessingRecordId: {
              type: "string",
              format: "uuid",
            },
            vin: {
              type: "string",
              example: "VFE34TEST00000001",
            },
            checkInDate: {
              type: "string",
              format: "date-time",
            },
            checkOutDate: {
              type: "string",
              format: "date-time",
            },
            visitorInfo: {
              type: "object",
              properties: {
                fullName: {
                  type: "string",
                },
                email: {
                  type: "string",
                  format: "email",
                },
                phone: {
                  type: "string",
                },
                relationship: {
                  type: "string",
                },
              },
            },
            odometer: {
              type: "integer",
              example: 15000,
            },
            status: {
              type: "string",
              enum: [
                "CHECKED_IN",
                "IN_DIAGNOSIS",
                "WAITING_CUSTOMER_APPROVAL",
                "PROCESSING",
                "READY_FOR_PICKUP",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            mainTechnicianId: {
              type: "string",
              format: "uuid",
            },
            createdByStaffId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        GuaranteeCase: {
          type: "object",
          properties: {
            guaranteeCaseId: {
              type: "string",
              format: "uuid",
            },
            vehicleProcessingRecordId: {
              type: "string",
              format: "uuid",
            },
            contentGuarantee: {
              type: "string",
              example: "Lỗi màn hình LCD",
            },
            status: {
              type: "string",
              enum: ["PENDING_ASSIGNMENT", "IN_DIAGNOSIS", "DIAGNOSED"],
            },
            leadTechId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        CaseLine: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            guaranteeCaseId: {
              type: "string",
              format: "uuid",
            },
            typeComponentId: {
              type: "string",
              format: "uuid",
            },
            quantity: {
              type: "integer",
              example: 1,
            },
            diagnosisText: {
              type: "string",
              example: "Màn hình LCD bị lỗi hiển thị",
            },
            correctionText: {
              type: "string",
              example: "Thay thế màn hình LCD mới",
            },
            warrantyStatus: {
              type: "string",
              enum: ["ELIGIBLE", "INELIGIBLE"],
            },
            status: {
              type: "string",
              enum: [
                "PENDING_APPROVAL",
                "CUSTOMER_APPROVED",
                "REJECTED_BY_OUT_OF_WARRANTY",
                "REJECTED_BY_TECH",
                "REJECTED_BY_CUSTOMER",
                "WAITING_FOR_PARTS",
                "READY_FOR_REPAIR",
                "IN_REPAIR",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            diagnosticTechId: {
              type: "string",
              format: "uuid",
            },
            repairTechId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        ComponentReservation: {
          type: "object",
          properties: {
            reservationId: {
              type: "string",
              format: "uuid",
            },
            caseLineId: {
              type: "string",
              format: "uuid",
            },
            componentId: {
              type: "string",
              format: "uuid",
            },
            status: {
              type: "string",
              enum: [
                "RESERVED",
                "PICKED_UP",
                "INSTALLED",
                "RETURNED",
                "CANCELLED",
              ],
            },
            pickedUpBy: {
              type: "string",
              format: "uuid",
            },
            pickedUpAt: {
              type: "string",
              format: "date-time",
            },
            installedAt: {
              type: "string",
              format: "date-time",
            },
            oldComponentSerial: {
              type: "string",
            },
            oldComponentReturned: {
              type: "boolean",
            },
            returnedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        StockTransferRequest: {
          type: "object",
          properties: {
            requestId: {
              type: "string",
              format: "uuid",
            },
            requestingWarehouseId: {
              type: "string",
              format: "uuid",
            },
            supplyingWarehouseId: {
              type: "string",
              format: "uuid",
            },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "APPROVED",
                "REJECTED",
                "IN_TRANSIT",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            requestedBy: {
              type: "string",
              format: "uuid",
            },
            requestDate: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Stock: {
          type: "object",
          properties: {
            stockId: {
              type: "string",
              format: "uuid",
            },
            warehouseId: {
              type: "string",
              format: "uuid",
            },
            typeComponentId: {
              type: "string",
              format: "uuid",
            },
            quantityInStock: {
              type: "integer",
              example: 100,
            },
            quantityReserved: {
              type: "integer",
              example: 10,
            },
            quantityAvailable: {
              type: "integer",
              example: 90,
            },
          },
        },
        TaskAssignment: {
          type: "object",
          properties: {
            taskAssignmentId: {
              type: "string",
              format: "uuid",
            },
            caselineId: {
              type: "string",
              format: "uuid",
            },
            technicianId: {
              type: "string",
              format: "uuid",
            },
            taskType: {
              type: "string",
              enum: ["DIAGNOSIS", "REPAIR"],
            },
            status: {
              type: "string",
              enum: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"],
            },
            isActive: {
              type: "boolean",
            },
            assignedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Warehouse: {
          type: "object",
          properties: {
            warehouseId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Kho Trung Tâm Hà Nội",
            },
            address: {
              type: "string",
            },
            context: {
              type: "string",
              enum: ["SERVICE_CENTER", "COMPANY"],
            },
            entityId: {
              type: "string",
              format: "uuid",
            },
            priority: {
              type: "integer",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description:
          "API endpoints cho xác thực người dùng - Login, Register, Token management",
      },
      {
        name: "Users",
        description:
          "API endpoints quản lý người dùng - CRUD operations, profile management",
      },
      {
        name: "Customers",
        description:
          "API endpoints quản lý khách hàng - Tìm kiếm, tạo mới, cập nhật thông tin khách hàng",
      },
      {
        name: "Vehicles",
        description:
          "API endpoints quản lý phương tiện - Quản lý thông tin xe, gán chủ xe, lịch sử bảo hành",
      },
      {
        name: "Vehicle Processing Records",
        description:
          "API endpoints quản lý hồ sơ sửa chữa xe - Tạo hồ sơ, phân công kỹ thuật viên, theo dõi tiến độ",
      },
      {
        name: "Guarantee Cases",
        description:
          "API endpoints quản lý các trường hợp bảo hành - Tạo case, cập nhật trạng thái, phân công lead tech",
      },
      {
        name: "Case Lines",
        description:
          "API endpoints quản lý chi tiết linh kiện trong case - Tạo, phê duyệt, allocate stock, assign technician",
      },
      {
        name: "Components",
        description:
          "API endpoints quản lý linh kiện - Tìm kiếm, thông tin chi tiết, compatible components",
      },
      {
        name: "Component Reservations",
        description:
          "API endpoints quản lý đặt trước linh kiện - Pickup, install, return components",
      },
      {
        name: "Warehouse & Stock",
        description:
          "API endpoints quản lý kho - Quản lý tồn kho, stock availability, warehouse info",
      },
      {
        name: "Stock Transfer Requests",
        description:
          "API endpoints quản lý yêu cầu chuyển kho - Request, approve, receive stock transfers",
      },
      {
        name: "Task Assignments",
        description:
          "API endpoints quản lý phân công công việc - Assign, update, complete tasks",
      },
      {
        name: "Work Schedule",
        description: "API endpoints quản lý lịch làm việc của kỹ thuật viên",
      },
      {
        name: "Chat",
        description: "API endpoints cho hệ thống chat hỗ trợ khách hàng",
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/api/routes/*.js", "./src/api/controller/*.js"],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
