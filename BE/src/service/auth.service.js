import { BadRequestError, NotFoundError } from "../error/index.js";

class AuthService {
  constructor({ userRepository, hashService, tokenService }) {
    this.userRepository = userRepository;
    this.hashService = hashService;
    this.tokenService = tokenService;
  }

  login = async ({ username, password }) => {
    const existingUser = await this.userRepository.findByUsername({
      username: username,
    });

    if (!existingUser) {
      throw new NotFoundError("Can not find user");
    }

    const isMatchedPassword = await this.hashService.compare({
      string: password,
      hashed: existingUser.password,
    });

    if (!isMatchedPassword) {
      throw new BadRequestError("Password is wrong");
    }

    const token = this.tokenService.generateToken({
      userId: existingUser.userId,
      roleName: existingUser.role.roleName,
      serviceCenterId: existingUser.serviceCenterId,
      companyId: existingUser.vehicleCompanyId,
    });

    return token;
  };
}

export default AuthService;
