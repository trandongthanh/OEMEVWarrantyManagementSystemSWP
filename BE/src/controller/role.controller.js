const RoleService = require("../service/role.service");

class RoleController {
  constructor() {
    this.roleService = RoleService;
  }
  createRole = async (req, res) => {
    try {
      const result = await this.roleService.createRole(req.body);

      res.status(201).json({
        status: "success",
        data: {
          result,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.statusCode(error.statusCode).json({
          status: "error",
        });
      }

      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  };
}

module.exports = new RoleController();
