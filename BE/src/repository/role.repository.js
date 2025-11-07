import db from "../models/index.cjs";

const { Role } = db;

class RoleRepository {
  findAll = async ({ where: {}, limit, offset }) => {
    const roles = await Role.findAll({
      where: where,
      limit: limit,
      offset: offset,
    });

    const rolesJSon = roles.map((role) => role.toJSON());

    return rolesJSon;
  };

  findByRoleName = async ({ where: {} }) => {
    const role = await Role.findOne({
      where: where,
    });

    return role ? role.toJSON() : null;
  };

  findById = async ({ roleId }) => {
    const role = await Role.findByPk(roleId);

    return role ? role.toJSON() : null;
  };

  create = async ({ roleName }) => {
    const newRole = await Role.create({
      roleName,
    });

    return newRole ? newRole.toJSON() : null;
  };
}

export default RoleRepository;
