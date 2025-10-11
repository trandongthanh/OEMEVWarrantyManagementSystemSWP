import { formatUTCtzHCM } from "../../util/formatUTCtzHCM.js";

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

  // register = async (req, res, next) => {
  //   const {
  //     username,
  //     password,
  //     phone,
  //     email,
  //     name,
  //     address,
  //     roleId,
  //     serviceCenterId,
  //   } = req.body;

  //   const newUser = await this.authService.register({
  //     username,
  //     password,
  //     phone,
  //     email,
  //     name,
  //     address,
  //     roleId,
  //     serviceCenterId,
  //   });

  //   const formatNewUser = {
  //     ...newUser,
  //     createdAt: formatUTCtzHCM(newUser.createdAt),
  //     updatedAt: formatUTCtzHCM(newUser.updatedAt),
  //   };

  //   res.status(201).json({
  //     status: "success",
  //     data: {
  //       user: formatNewUser,
  //     },
  //   });
  // };
}

export default AuthController;
