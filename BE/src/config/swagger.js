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
        url: "http://localhost:3000/api",
        description: "Development server",
      },
      {
        url: "https://api.oemevwarranty.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
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
            },
            name: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            phoneNumber: {
              type: "string",
            },
            role: {
              type: "string",
              enum: [
                "service_center_staff",
                "service_center_technician",
                "service_center_manager",
                "warehouse_manager",
                "warranty_admin",
              ],
            },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            vin: {
              type: "string",
              description: "Vehicle Identification Number",
            },
            licensePlate: {
              type: "string",
            },
            color: {
              type: "string",
            },
            manufacturingYear: {
              type: "integer",
            },
            warrantyStartDate: {
              type: "string",
              format: "date",
            },
            warrantyEndDate: {
              type: "string",
              format: "date",
            },
          },
        },
        Customer: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            phoneNumber: {
              type: "string",
            },
            address: {
              type: "string",
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
            componentCode: {
              type: "string",
            },
            name: {
              type: "string",
            },
            category: {
              type: "string",
            },
            price: {
              type: "number",
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
        name: "Vehicle Processing Record",
        description:
          "API endpoints quản lý hồ sơ sửa chữa xe - Tạo hồ sơ, phân công kỹ thuật viên, theo dõi tiến độ",
      },
      {
        name: "Guarantee Cases",
        description:
          "API endpoints quản lý các trường hợp bảo hành - Tạo case, cập nhật trạng thái, quản lý linh kiện",
      },
      {
        name: "Case Lines",
        description:
          "API endpoints quản lý linh kiện cho các case - Thêm, cập nhật, xóa linh kiện trong case",
      },
      {
        name: "Components",
        description:
          "API endpoints quản lý linh kiện - Tìm kiếm, thông tin chi tiết linh kiện",
      },
      {
        name: "Warehouse",
        description:
          "API endpoints quản lý kho - Quản lý tồn kho, nhập xuất linh kiện",
      },
      {
        name: "Service Centers",
        description: "API endpoints quản lý trung tâm dịch vụ",
      },
      {
        name: "Chat",
        description: "API endpoints cho hệ thống chat hỗ trợ khách hàng",
      },
      {
        name: "Mail",
        description: "API endpoints gửi email thông báo",
      },
      {
        name: "Notifications",
        description: "API endpoints quản lý thông báo",
      },
      {
        name: "Work Schedule",
        description: "API endpoints quản lý lịch làm việc của kỹ thuật viên",
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
