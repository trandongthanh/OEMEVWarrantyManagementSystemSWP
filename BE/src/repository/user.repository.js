import dayjs from "dayjs";
import db from "../models/index.cjs";
const {
  User,
  Role,
  ServiceCenter,
  WorkSchedule,
  TaskAssignment,
  VehicleCompany,
} = db;

class UserRepository {
  async findByUsername({ username }) {
    const existingUser = await User.findOne({
      where: {
        username: username,
      },

      include: [
        {
          model: Role,
          as: "role",
          attributes: ["roleName"],
        },
      ],
    });

    if (!existingUser) {
      return null;
    }

    return existingUser.toJSON();
  }

  async getAllTechnicians({ status, serviceCenterId }) {
    const today = dayjs().format("YYYY-MM-DD");

    const whereCondition = {
      workDate: today,
    };

    if (status) {
      whereCondition.status = status;
    }

    const userCondition = {};

    if (serviceCenterId) {
      userCondition.serviceCenterId = serviceCenterId;
    }

    const technicians = await User.findAll({
      where: userCondition,
      attributes: [
        "userId",
        "name",
        [
          db.sequelize.fn(
            "COUNT",
            db.sequelize.col("tasks.task_assignment_id")
          ),
          "activeTaskCount",
        ],
      ],

      include: [
        {
          model: WorkSchedule,
          as: "workSchedule",
          where: whereCondition,
          attributes: ["workDate", "status"],
        },
        {
          model: TaskAssignment,
          as: "tasks",
          where: { isActive: true },
          required: false,
          attributes: [],
        },
      ],

      group: ["userId"],
    });

    return technicians.map((technician) => technician.toJSON());
  }

  async findUserById({ userId }, transaction = null, lock = null) {
    const user = await User.findOne({
      where: {
        userId: userId,
      },

      include: [
        {
          model: Role,
          as: "role",

          attributes: ["roleName"],
        },
        {
          model: ServiceCenter,
          as: "serviceCenter",
          attributes: ["serviceCenterId", "name", "address"],

          include: [
            {
              model: VehicleCompany,
              as: "vehicleCompany",
              attributes: ["vehicleCompanyId", "name"],
              required: false,
            },
          ],
        },
      ],

      transaction,
      lock,
    });

    if (!user) {
      return null;
    }

    return user.toJSON();
  }
}

export default UserRepository;
