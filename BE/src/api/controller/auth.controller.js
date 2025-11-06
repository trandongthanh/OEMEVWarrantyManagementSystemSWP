import { BadRequestError } from "../../error/index.js";

class AuthController {
  #authService;
  constructor({ authService }) {
    this.#authService = authService;
  }

  login = async (req, res, next) => {
    const { username, password } = req.body;

    const result = await this.#authService.login({ username, password });

    res.status(200).json({
      status: "success",
      data: {
        token: result,
      },
    });
  };

  registerInServiceCenter = async (req, res, next) => {
    const { username, password, email, phone, address, name, roleId } =
      req.body;

    const { serviceCenterId } = req.user || {};

    if (!serviceCenterId) {
      throw new BadRequestError(
        "Service center information is missing in request"
      );
    }

    const newUser = await this.#authService.registerInServiceCenter({
      username,
      password,
      email,
      phone,
      address,
      name,
      roleId,
      serviceCenterId,
    });

    res.status(201).json({
      status: "success",
      data: newUser,
    });
  };
}

export default AuthController;
