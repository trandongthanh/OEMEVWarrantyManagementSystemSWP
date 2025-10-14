module.exports = (sequelize, DataTypes) => {
  const WorkSchedule = sequelize.define(
    "WorkSchedule",
    {
      scheduleId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "schedule_id",
      },

      technicianId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "technician_id",
      },

      workDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "work_date",
      },

      status: {
        type: DataTypes.ENUM(
          "WORKING",
          "DAY_OFF",
          "LEAVE_REQUESTED",
          "LEAVE_APPROVED"
        ),
        allowNull: false,
        defaultValue: "WORKING",
      },

      requestReason: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "request_reason",
      },

      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "work_schedule",
      indexes: [
        {
          unique: true,
          fields: ["technician_id", "work_date"],
        },
      ],
    }
  );

  WorkSchedule.associate = function (models) {
    WorkSchedule.belongsTo(models.User, {
      foreignKey: "technician_id",
      as: "technician",
    });
  };

  return WorkSchedule;
};
