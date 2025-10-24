import { AuthenticationError } from "../error/index.js";

class AuthService {
  #userRepository;
  #hashService;
  #tokenService;

  constructor({ userRepository, hashService, tokenService }) {
    this.#userRepository = userRepository;
    this.#hashService = hashService;
    this.#tokenService = tokenService;
  }

  login = async ({ username, password }) => {
    const existingUser = await this.#userRepository.findByUsername({
      username: username,
    });

    if (!existingUser) {
      throw new AuthenticationError("Username or password is incorrect");
    }

    const isMatchedPassword = await this.#hashService.compare({
      string: password,
      hashed: existingUser.password,
    });

    if (!isMatchedPassword) {
      throw new AuthenticationError("Username or password is incorrect");
    }

    const token = this.#tokenService.generateToken({
      userId: existingUser.userId,
      roleName: existingUser.role.roleName,
      serviceCenterId: existingUser.serviceCenterId,
      companyId: existingUser.vehicleCompanyId,
    });

    return token;
  };
}

export default AuthService;
