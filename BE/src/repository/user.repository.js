import db from "../../models/index.cjs";

const { User, Role } = db;

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

    return newUser;
  }
}

export default UserRepository;
