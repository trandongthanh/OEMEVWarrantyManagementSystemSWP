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
        type: DataTypes.STRING,
        allowNull: false,
        field: "vin",
      },

      checkInDate: {
        type: DataTypes.DATE,
        defaultVlaue: DataTypes.NOW,
        allowNull: "false",
        field: "check_in_date",
      },

      odometer: {
        type: DataTypes.INTEGER,
        field: "odometer",
      },

      status: {
        type: DataTypes.ENUM(
          "CHECKED_IN",
          "IN_DIAGNOSIS",
          "WAITING_CUSTOMER_APPROVAL",
          "PAID",
          "IN_REPAIR",
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

      diagnosticFee: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: "diagnostic_fee",
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
