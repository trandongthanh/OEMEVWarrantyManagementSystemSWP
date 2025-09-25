const AuthService = require("../service/auth.service");

class AuthController {
  constructor() {
    this.authService = AuthService;
  }
  registerStaffForAdmin = async (req, res) => {
    try {
      const result = await this.authService.registerStaffForAdmin(req.body);

      res.status(201).json({
        status: "success",
        data: {
          result,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      }
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  };

  login = async (req, res) => {
    try {
      const { user, token } = await this.authService.login(req.body);

      res.status(200).json({
        status: "success",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  };

  createProfileUserByServiceCenterStaff = async (req, res) => {
    try {
      const result =
        await this.authService.createProfileUserByServiceCenterStaff(req.body);

      res.status(201).json({
        status: "true",
        data: {
          result,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      }

      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  };
}

module.exports = new AuthController();
