import db from "../models/index.cjs";
const { User, Role, ServiceCenter } = db;

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

    return existingUser.toJSON();
  }

  async createUser({
    username,
    password,
    phone,
    email,
    name,
    address,
    roleId,
    serviceCenterId,
    vehicleCompanyId,
  }) {
    const newUser = await User.create({
      username,
      password,
      phone,
      email,
      name,
      address,
      roleId,
      serviceCenterId,
      vehicleCompanyId,
    });

    return newUser.toJSON();
  }

  // getAllTech = async ({ serviceCenterId }) => {
  //   const techList = await User.fineAll({
  //     attributes: ["name"],

  //     where: {
  //       serviceCenterId: serviceCenterId,
  //     },

  //     include: [
  //       {
  //         model: ServiceCenter,
  //         as: "serviceCenter",
  //         attributes: ["name"],
  //       },
  //       {
  //         model:
  //       }
  //     ],
  //   });
  // };
}

export default UserRepository;
