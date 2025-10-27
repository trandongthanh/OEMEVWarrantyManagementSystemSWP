const { default: dayjs } = require("dayjs");

module.exports = (sequelize, DataTypes) => {
  const VehicleProcessingRecord = sequelize.define(
    "VehicleProcessingRecord",
    {
      vehicleProcessingRecordId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "vehicle_processing_record_id",
      },

      vin: {
        type: DataTypes.STRING(17),
        allowNull: false,
        field: "vin",
      },

      checkInDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: "check_in_date",
      },

      checkOutDate: {
        type: DataTypes.DATE,
        field: "check_out_date",
      },

      visitorInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isVisitorInfoValid(value) {
            if (!value) {
              return;
            }

            if (typeof value !== "object" || Array.isArray(value)) {
              throw new Error("visitorInfo must be a valid JSON object");
            }

            if (
              !value.fullName ||
              typeof value.fullName !== "string" ||
              value.fullName.trim() === ""
            ) {
              throw new Error(
                "visitorInfo.fullName must be a non-empty string"
              );
            }

            if (
              !value.phone ||
              typeof value.phone !== "string" ||
              value.phone.trim() === ""
            ) {
              throw new Error(
                "visitorInfo must have a non-empty phone number."
              );
            }
          },
        },
        field: "visitor_info",
      },

      odometer: {
        type: DataTypes.INTEGER,
        field: "odometer",
      },

      duration: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.checkOutDate && this.checkInDate) {
            dayjs(this.checkOutDate).diff(dayjs(this.checkInDate), "day");
          }
        },
      },

      status: {
        type: DataTypes.ENUM(
          "CHECKED_IN",
          "IN_DIAGNOSIS",
          "WAITING_CUSTOMER_APPROVAL",
          "PROCESSING",
          "READY_FOR_PICKUP",
          "COMPLETED",
          "CANCELLED"
        ),
        allowNull: false,
        defaultValue: "CHECKED_IN",
        field: "status",
      },

      createdByStaffId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "created_by_staff_id",
      },

      mainTechnicianId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "main_technician_id",
      },
    },
    {
      tableName: "vehicle_processing_record",
    }
  );

  VehicleProcessingRecord.associate = function (models) {
    VehicleProcessingRecord.belongsTo(models.User, {
      foreignKey: "created_by_staff_id",
      as: "createdByStaff",
    });

    VehicleProcessingRecord.belongsTo(models.User, {
      foreignKey: "main_technician_id",
      as: "mainTechnician",
    });

    VehicleProcessingRecord.belongsTo(models.Vehicle, {
      foreignKey: "vin",
      as: "vehicle",
    });

    VehicleProcessingRecord.hasMany(models.GuaranteeCase, {
      foreignKey: "vehicle_processing_record_id",
      as: "guaranteeCases",
    });
  };

  return VehicleProcessingRecord;
};
