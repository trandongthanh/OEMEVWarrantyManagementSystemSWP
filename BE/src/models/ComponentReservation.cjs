module.exports = (sequelize, DataTypes) => {
  const ComponentReservation = sequelize.define(
    "ComponentReservation",
    {
      reservationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "reservation_id",
      },

      caseLineId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "case_line_id",
      },

      componentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "component_id",
      },

      status: {
        type: DataTypes.ENUM("RESERVED", "PICKED_UP", "INSTALLED", "CANCELLED"),
        allowNull: false,
        defaultValue: "RESERVED",
        field: "status",
      },

      pickedUpBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "picked_up_by",
      },

      pickedUpAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "picked_up_at",
      },

      installedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "installed_at",
      },

      oldComponentSerial: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "old_component_serial",
      },

      oldComponentCondition: {
        type: DataTypes.ENUM("DEFECTIVE", "DAMAGED"),
        allowNull: true,
        field: "old_component_condition",
      },

      oldComponentReturned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "old_component_returned",
      },

      returnedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "returned_at",
      },

      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "cancelled_at",
      },
    },
    {
      tableName: "component_reservation",
    }
  );

  ComponentReservation.associate = function (models) {
    ComponentReservation.belongsTo(models.CaseLine, {
      foreignKey: "case_line_id",
      as: "caseLine",
    });

    ComponentReservation.belongsTo(models.Component, {
      foreignKey: "component_id",
      as: "component",
    });

    ComponentReservation.belongsTo(models.User, {
      foreignKey: "picked_up_by",
      as: "pickedUpByTech",
    });
  };

  return ComponentReservation;
};
