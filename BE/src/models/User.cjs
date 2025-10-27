module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "user_id",
      },

      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
        field: "user_name",
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        field: "password",
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Email cannot be empty",
          },

          isEmail: {
            msg: "Must be a validate email",
          },
        },
        unique: true,
        field: "email",
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        unique: true,
        field: "phone",
      },

      address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        field: "address",
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        field: "name",
      },

      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "role_id",
      },

      serviceCenterId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "service_center_id",
      },

      vehicleCompanyId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "vehicle_company_id",
      },
    },
    {
      tableName: "user",
    }
  );

  User.associate = function (models) {
    User.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });

    User.belongsTo(models.ServiceCenter, {
      foreignKey: "service_center_id",
      as: "serviceCenter",
    });

    User.belongsTo(models.VehicleCompany, {
      foreignKey: "vehicle_company_id",
      as: "vehicleCompany",
    });

    User.hasMany(models.VehicleProcessingRecord, {
      foreignKey: "created_by_staff_id",
      as: "createdRecordsAsStaff",
    });

    User.hasMany(models.GuaranteeCase, {
      foreignKey: "lead_tech_id",
      as: "leadTechnician",
    });

    User.hasMany(models.WorkSchedule, {
      foreignKey: "technician_id",
      as: "workSchedule",
    });

    User.hasMany(models.CaseLine, {
      foreignKey: "diagnostic_tech_id",
      as: "diagnosedCaseLines",
    });

    User.hasMany(models.CaseLine, {
      foreignKey: "repair_tech_id",
      as: "repairedCaseLines",
    });

    User.hasMany(models.TaskAssignment, {
      foreignKey: "technician_id",
      as: "tasks",
    });

    User.hasMany(models.StockTransferRequest, {
      foreignKey: "requested_by_user_id",
      as: "stockTransferRequests",
    });

    User.hasMany(models.StockTransferRequest, {
      foreignKey: "approved_by_user_id",
      as: "approvedStockTransferRequests",
    });

    User.hasMany(models.StockTransferRequest, {
      foreignKey: "rejected_by_user_id",
      as: "rejectedStockTransferRequests",
    });

    User.hasMany(models.StockTransferRequest, {
      foreignKey: "cancelled_by_user_id",
      as: "cancelledStockTransferRequests",
    });

    User.hasMany(models.StockTransferRequest, {
      foreignKey: "received_by_user_id",
      as: "receivedStockTransferRequests",
    });
  };

  return User;
};
