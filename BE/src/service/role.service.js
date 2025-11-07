class RoleService {
  #roleRepository;

  constructor({ roleRepository }) {
    this.#roleRepository = roleRepository;
  }

  getAllRoles = async ({ roleName, limit, page }) => {
    const serviceCenterRoles = ["service_center_manager"];

    const companyRoles = ["emv_admin"];

    const pageValue = parseInt(page, 10) || 1;
    const limitValue = parseInt(limit, 10) || 10;
    const offset = (pageValue - 1) * limitValue;

    if (serviceCenterRoles.includes(roleName)) {
      const roleNames = [
        "service_center_staff",
        "service_center_technician",
        "parts_coordinator_service_center",
        "service_center_manager",
      ];
      return this.#roleRepository.findAll({
        roleNames: roleNames,
        limit: limitValue,
        offset: offset,
      });
    }

    if (companyRoles.includes(roleName)) {
      return this.#roleRepository.findAll({
        where: {
          roleName: ["emv_staff", "parts_coordinator_company", "emv_admin"],
        },
      });
    }

    return [];
  };

  createRole = async ({ roleName }) => {
    const roleNames = [
      "service_center_staff",
      "service_center_technician",
      "emv_staff",
      "parts_coordinator_service_center",
      "parts_coordinator_company",
      "emv_admin",
      "service_center_manager",
    ];

    if (!roleNames.includes(roleName)) {
      throw new BadRequestError("Invalid role name");
    }

    const existingRole = await this.#roleRepository.findByRoleName({
      where: { roleName },
    });

    if (existingRole) {
      throw new Error("Role already exists");
    }

    const newRole = await this.#roleRepository.create({ roleName });

    if (!newRole) {
      throw new Error("Failed to create role");
    }

    return newRole;
  };

  getRoleById = async ({ roleId }) => {
    const role = await this.#roleRepository.findById({ roleId });

    return role;
  };
}

export default RoleService;
