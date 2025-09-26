const { Role } = require("../../models/index");

class RoleRepository {
  async findRolByName({ roleName }) {
    const role = await Role.findOne({
      where: {
        roleName,
      },
    });

    return role;
  }

  async createRole({ roleName }) {
    const newRole = await Role.create({
      roleName,
    });

    return newRole;
  }
}

module.exports = new RoleRepository();
