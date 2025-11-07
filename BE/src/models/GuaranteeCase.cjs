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
        type: DataTypes.ENUM("PENDING_ASSIGNMENT", "IN_DIAGNOSIS", "DIAGNOSED"),
        allowNull: false,
        defaultValue: "PENDING_ASSIGNMENT",
        field: "status",
      },

      contentGuarantee: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "content_guarantee",
      },

      leadTechId: {
        type: DataTypes.UUID,
        field: "lead_tech_id",
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

    GuaranteeCase.hasMany(models.CaseLine, {
      foreignKey: "guarantee_case_id",
      as: "caseLines",
    });

    GuaranteeCase.hasMany(models.TaskAssignment, {
      foreignKey: "guarantee_case_id",
      as: "taskAssignments",
    });
  };

  return GuaranteeCase;
};
