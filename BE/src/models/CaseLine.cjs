module.exports = (sequelize, DataTypes) => {
  const CaseLine = sequelize.define("CaseLine", {
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

    techId: { type: DataTypes.UUID, allowNull: false, field: "tech_id" },

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
      type: DataTypes.ENUM("PENDING_APPROVAL", "ELIGIBLE", "INELIGIBLE"),
      allowNull: false,
      defaultValue: "PENDING_APPROVAL",
      field: "warranty_status",
    },

    componentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "component_id",
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "quantity",
    },

    status: {
      type: DataTypes.ENUM(
        "pending_approval",
        "waiting_for_parts",
        "in_progress",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending_approval",
      field: "status",
    },
  });

  CaseLine.associate = function (models) {
    CaseLine.belongsTo(models.GuaranteeCase, {
      foreignKey: "guarantee_case_id",
      as: "guaranteeCase",
    });

    CaseLine.belongsTo(models.User, {
      foreignKey: "tech_id",
      as: "ownerTech",
    });

    CaseLine.belongsTo(models.TypeComponent, {
      foreignKey: "component_id",
      as: "typeComponent",
    });

    // CaseLine.hasMany(models.TaskAssignment, {
    //   foreignKey: "case_line_id",
    //   as: "assignments",
    // });

    CaseLine.hasMany(models.ComponentReservation, {
      foreignKey: "case_line_id",
      as: "reservations",
    });
  };

  return CaseLine;
};
