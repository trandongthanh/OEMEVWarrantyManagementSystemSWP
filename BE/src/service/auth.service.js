import { BadRequestError, NotFoundError } from "../error/index.js";
import { formatUTCtzHCM } from "../util/formatUTCtzHCM.js";

class AuthService {
  constructor({ userRepository, hashService, tokenService }) {
    this.userRepository = userRepository;
    this.hashService = hashService;
    this.tokenService = tokenService;
  }

  login = async (userLoginData) => {
    const { username, password } = userLoginData;

    if (!username || !password) {
      throw new BadRequestError("Username and password is requied");
    }

    const existingUser = await this.userRepository.findByUsername({
      username: username,
    });

    if (!existingUser) {
      throw new NotFoundError("Cannot find user with this username");
    }

    const isMatchedPasword = await this.hashService.compare({
      string: password,
      hashed: existingUser.password,
    });

    if (!isMatchedPasword) {
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

  register = async ({
    username,
    password,
    phone,
    email,
    name,
    address,
    roleId,
    serviceCenterId,
  }) => {
    const newUser = await this.userRepository.createUser({
      username,
      password,
      phone,
      email,
      name,
      address,
      roleId,
      serviceCenterId,
    });

    return newUser;
  };
}

export default AuthService;
