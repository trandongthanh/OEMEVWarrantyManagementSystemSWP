class RoleController {
  #roleService;

  constructor(roleService) {
    this.#roleService = roleService;
  }

  getAllRoles = async (req, res, next) => {
    const { roleName } = req.user;

    const { limit, page } = req.query;

    const roles = await this.#roleService.getAllRoles({
      roleName,
      limit,
      page,
    });

    res.status(200).json({
      status: "success",
      data: roles,
    });
  };

  createRole = async (req, res, next) => {
    const { roleName } = req.body;

    const newRole = await this.#roleService.createRole({
      roleName,
    });

    res.status(201).json({
      status: "success",
      data: newRole,
    });
  };

  getRoleById = async (req, res, next) => {
    const { roleId } = req.params;

    const role = await this.#roleService.getRoleById({ roleId });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      status: "success",
      data: role,
    });
  };
}

export default RoleController;
