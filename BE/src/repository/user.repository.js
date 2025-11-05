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
          db.sequelize.literal(
            `(SELECT COUNT(*) FROM \`task_assignment\` AS \`tasks_sub\` WHERE \`tasks_sub\`.\`technician_id\` = \`User\`.\`user_id\` AND \`tasks_sub\`.\`is_active\` = TRUE)`
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

  findServiceCenterById = async ({ serviceCenterId }) => {
    const serviceCenter = await ServiceCenter.findByPk(serviceCenterId, {
      attributes: ["serviceCenterId", "vehicleCompanyId"],
    });

    if (!serviceCenter) {
      return null;
    }

    return serviceCenter.toJSON();
  };

  findVehicleCompanyById = async ({ vehicleCompanyId }) => {
    const vehicleCompany = await VehicleCompany.findByPk(vehicleCompanyId, {
      attributes: ["vehicleCompanyId", "name"],
    });

    if (!vehicleCompany) {
      return null;
    }

    return vehicleCompany.toJSON();
  };

  createUser = async ({
    username,
    password,
    email,
    phone,
    address,
    name,
    roleId,
    serviceCenterId,
    vehicleCompanyId,
  }) => {
    const newUser = await User.create({
      username,
      password,
      email,
      phone,
      address,
      name,
      roleId,
      serviceCenterId,
      vehicleCompanyId,
    });

    return newUser.toJSON();
  };

  getActiveTaskCountForTechnician = async ({ technicianId }) => {
    const activeTaskCount = await TaskAssignment.count({
      where: {
        technicianId: technicianId,
        isActive: true,
      },
    });

    return activeTaskCount;
  };
}

export default UserRepository;
