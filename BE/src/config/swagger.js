import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OEM EV Warranty Management System API",
      version: "1.0.0",
      description:
        "API documentation for OEM EV Warranty Management System - A comprehensive system for managing electric vehicle warranties, service records, and inventory. All endpoints are visible. Some endpoints require authentication (🔒 icon indicates authentication required).",
      contact: {
        name: "API Support",
        email: "support@oem-warranty.com",
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
        url: "https://api.oem-warranty.com/v1",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description:
          "🔓 Public - User authentication and authorization endpoints (no token required)",
      },
      {
        name: "User",
        description:
          "🔓 Public - User management operations (no token required for registration)",
      },
      {
        name: "Customer",
        description: "🔓 Public - Customer information and search operations",
      },
      {
        name: "Vehicle",
        description:
          "🔒 Protected - Vehicle management, registration and warranty information (authentication required)",
      },
      {
        name: "Vehicle Processing Record",
        description:
          "🔒 Protected - Service records, technician assignments and component management (authentication required)",
      },
      {
        name: "Guarantee Case",
        description:
          "🔒 Protected - Warranty claim cases and issue tracking (authentication required)",
      },
      {
        name: "Case Line",
        description:
          "🔒 Protected - Work items and component replacements within guarantee cases (authentication required)",
      },
      {
        name: "Warehouse",
        description:
          "🔒 Protected - Inventory management and stock operations (authentication required)",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter JWT token obtained from /auth/login endpoint. Format: Bearer <your_token>",
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
              example: "Error message description",
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
              description: "Response data object",
            },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    example: "Email is required",
                  },
                },
              },
            },
          },
        },
        GuaranteeCase: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            description: {
              type: "string",
            },
            symptom: {
              type: "string",
            },
            diagnosis: {
              type: "string",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "cancelled"],
            },
            vehicleProcessingRecordId: {
              type: "string",
              format: "uuid",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
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
              minimum: 1,
            },
            description: {
              type: "string",
            },
            laborHours: {
              type: "number",
              minimum: 0,
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "cancelled"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            vin: {
              type: "string",
            },
            dateOfManufacture: {
              type: "string",
              format: "date-time",
            },
            placeOfManufacture: {
              type: "string",
            },
            licensePlate: {
              type: "string",
            },
            purchaseDate: {
              type: "string",
              format: "date-time",
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
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              type: "string",
            },
            address: {
              type: "string",
            },
          },
        },
      },
    },
  },
  apis: ["./src/api/routes/*.js", "./src/api/controller/*.js"],
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };
