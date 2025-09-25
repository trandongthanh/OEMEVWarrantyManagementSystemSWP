const { Op } = require("sequelize");
const { User, Role } = require("../../models/index");

class UserRepository {
  async findUserByUsername({ username }) {
    const rawUser = await User.findOne({
      where: {
        username,
      },

      attributes: ["userId", "email", "phone", "address", "name", "password"],
      include: [{ model: Role, as: "role", attributes: ["roleName"] }],
    });

    return rawUser;
  }

  async findUserById({ id }) {
    const rawUser = await User.findByPk(id);

    return rawUser;
  }

  async findUserByEmailOrPhone(identifier) {
    const rawUser = await User.findOne({
      where: {
        [Op.or]: [{ phone: identifier.phone }, { email: identifier.email }],
      },
    });

    return rawUser;
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
  }) {
    console.log(
      username,
      password,
      phone,
      email,
      name,
      address,
      roleId,
      serviceCenterId
    );
    const newUser = await User.create({
      username,
      password,
      phone,
      email,
      name,
      address,
      roleId,
      serviceCenterId,
    });

    return newUser;
  }
}

module.exports = new UserRepository();
