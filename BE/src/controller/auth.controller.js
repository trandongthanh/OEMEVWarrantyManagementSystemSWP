class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  login = async (req, res, next) => {
    const result = await this.authService.login(req.body);

    res.status(200).json({
      status: "success",
      data: {
        token: result,
      },
    });
  };
}

export default AuthController;
