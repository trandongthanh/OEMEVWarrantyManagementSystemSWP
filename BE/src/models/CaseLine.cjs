module.exports = (sequelize, DataTypes) => {
  const CaseLine = sequelize.define(
    "CaseLine",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "id",
      },

      guaranteeCaseId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "guarantee_case_id",
      },

      diagnosticTechId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "diagnostic_tech_id",
      },

      repairTechId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "repair_tech_id",
      },

      diagnosisText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "diagnosis_text",
      },

      correctionText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "correction_text",
      },

      warrantyStatus: {
        type: DataTypes.ENUM("ELIGIBLE", "INELIGIBLE"),
        field: "warranty_status",
      },

      typeComponentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "type_component_id",
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: "quantity",
      },

      status: {
        type: DataTypes.ENUM(
          "PENDING_APPROVAL",
          "CUSTOMER_APPROVED",
          "REJECTED_BY_OUT_OF_WARRANTY",
          "REJECTED_BY_TECH",
          "REJECTED_BY_CUSTOMER",
          "WAITING_FOR_PARTS",
          "READY_FOR_REPAIR",
          "IN_REPAIR",
          "COMPLETED",
          "CANCELLED"
        ),
        allowNull: false,
        defaultValue: "PENDING_APPROVAL",
        field: "status",
      },

      rejectionReason: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "rejection_reason",
      },
    },
    {
      tableName: "case_line",
    }
  );

  CaseLine.associate = function (models) {
    CaseLine.belongsTo(models.GuaranteeCase, {
      foreignKey: "guarantee_case_id",
      as: "guaranteeCase",
    });

    CaseLine.belongsTo(models.TypeComponent, {
      foreignKey: "type_componentId",
      as: "typeComponent",
    });

    CaseLine.hasMany(models.TaskAssignment, {
      foreignKey: "case_line_id",
      as: "assignments",
    });

    CaseLine.belongsTo(models.User, {
      foreignKey: "diagnostic_tech_id",
      as: "diagnosticTechnician",
    });

    CaseLine.belongsTo(models.User, {
      foreignKey: "repair_tech_id",
      as: "repairTechnician",
    });

    CaseLine.hasMany(models.ComponentReservation, {
      foreignKey: "case_line_id",
      as: "reservations",
    });
  };

  return CaseLine;
};
