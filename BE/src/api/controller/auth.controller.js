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
}

export default AuthController;
