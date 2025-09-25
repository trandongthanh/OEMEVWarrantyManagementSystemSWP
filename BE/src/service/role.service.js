const { BadRequestError, ConflictError } = require("../error");
const RoleRepository = require("../repository/role.repository");

class RoleService {
  constructor() {
    this.roleRepository = RoleRepository;
  }

  createRole = async (roleData) => {
    const { roleName } = roleData;

    if (!roleName) {
      throw new BadRequestError("Role name is required");
    }

    const existingRole = await this.roleRepository.findRolByName({ roleName });

    if (existingRole) {
      throw new ConflictError("Role name is already exist");
    }

    const newRole = await this.roleRepository.createRole({ roleName });

    return newRole;
  };
}

module.exports = new RoleService();
