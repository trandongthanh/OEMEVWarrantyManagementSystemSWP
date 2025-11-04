class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  login = async (req, res, next) => {
    const { username, password } = req.body;

    const result = await this.authService.login({ username, password });

    res.status(200).json({
      status: "success",
      data: {
        token: result,
      },
    });
  };

  register = async (req, res, next) => {
    const {
      username,
      password,
      email,
      phone,
      address,
      name,
      roleId,
      serviceCenterId,
      vehicleCompanyId,
    } = req.body;

    const newUser = await this.authService.register({
      username,
      password,
      email,
      phone,
      address,
      name,
      roleId,
      serviceCenterId,
      vehicleCompanyId,
    });

    res.status(200).json({
      status: "success",
      data: newUser,
    });
  };
}

export default AuthController;
