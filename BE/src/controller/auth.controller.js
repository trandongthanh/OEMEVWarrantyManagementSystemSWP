class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  login = async (req, res, next) => {
    try {
      const result = await this.authService.login(req.body);

      res.status(200).json({
        status: "success",
        data: {
          token: result,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  };
}

export default AuthController;
