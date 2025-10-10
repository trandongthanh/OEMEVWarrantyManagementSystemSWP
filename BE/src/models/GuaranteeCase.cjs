module.exports = (sequelize, DataTypes) => {
  const GuaranteeCase = sequelize.define(
    "GuaranteeCase",
    {
      guaranteeCaseId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "guarantee_case_id",
      },

      vehicleProcessingRecordId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "vehicle_processing_record_id",
      },

      status: {
        type: DataTypes.ENUM(
          "pending_diagnosis",
          "on_hold",
          "in_progress",
          "completed",
          "rejected",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending_diagnosis",
        field: "status",
      },

      contentGuarantee: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "content_guarantee",
      },

      leadTechId: {
        type: DataTypes.UUID,
        filed: "lech_tech_id",
      },

      expectedCompletionDate: {
        type: DataTypes.DATE,
        field: "expected_completion_date",
      },

      openedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "open_at",
      },

      closeAt: {
        type: DataTypes.DATE,
        field: "close_at",
      },
    },
    {
      tableName: "guarantee_case",
    }
  );

  GuaranteeCase.associate = function (models) {
    GuaranteeCase.belongsTo(models.VehicleProcessingRecord, {
      foreignKey: "vehicle_processing_record_id",
      as: "vehicleProcessingRecord",
    });

    GuaranteeCase.belongsTo(models.User, {
      foreignKey: "lead_tech_id",
      as: "leadTechnicianCases",
    });

    // GuaranteeCase.hasMany(models.PartShipment, {
    //   foreignKey: "guarantee_case_id",
    //   as: "partShipMents",
    // });

    // GuaranteeCase.hasMany(models.InstalledPart, {
    //   foreignKey: "guarantee_case_id",
    //   as: "installedParts",
    // });

    // GuaranteeCase.hasMany(models.Report, {
    //   foreignKey: "guarantee_case_id",
    //   as: "reports",
    // });

    // GuaranteeCase.hasMany(models.TaskAssignment, {
    //   foreignKey: "guarantee_case_id",
    //   as: "taskAssgnments",
    // });

    // GuaranteeCase.hasMany(models.StatusForGuaranteeCase, {
    //   foreignKey: "guarantee_case_id",
    //   as: "status",
    // });
  };

  return GuaranteeCase;
};
