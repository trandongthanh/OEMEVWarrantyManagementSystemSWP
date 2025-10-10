import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OEM EV Warranty Management System API",
      version: "1.0.0",
      description:
        "API documentation for OEM EV Warranty Management System - A comprehensive system for managing electric vehicle warranties, service records, and inventory",
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
        description: "User authentication and authorization endpoints",
      },
      {
        name: "User",
        description: "User management operations",
      },
      {
        name: "Customer",
        description: "Customer information and search operations",
      },
      {
        name: "Vehicle",
        description:
          "Vehicle management, registration and warranty information",
      },
      {
        name: "Vehicle Processing Record",
        description:
          "Service records, technician assignments and component management",
      },
      {
        name: "Warehouse",
        description: "Inventory management and stock operations",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token obtained from login endpoint",
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
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controller/*.js"],
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };
