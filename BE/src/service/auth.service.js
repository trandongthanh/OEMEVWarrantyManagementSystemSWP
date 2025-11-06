import { AuthenticationError, BadRequestError } from "../error/index.js";

class AuthService {
  #userRepository;
  #hashService;
  #tokenService;
  #serviceCenterRepository;

  constructor({
    userRepository,
    hashService,
    tokenService,
    serviceCenterRepository,
  }) {
    this.#userRepository = userRepository;
    this.#hashService = hashService;
    this.#tokenService = tokenService;
    this.#serviceCenterRepository = serviceCenterRepository;
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

  registerInServiceCenter = async ({
    username,
    password,
    email,
    phone,
    address,
    name,
    roleId,
    serviceCenterId,
  }) => {
    const existingUser = await this.#userRepository.findByUsername({
      username: username,
    });

    if (existingUser) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await this.#hashService.hash({ string: password });

    if (serviceCenterId) {
      const serviceCenter =
        await this.#serviceCenterRepository.findServiceCenterById({
          serviceCenterId,
        });

      if (!serviceCenter) {
        throw new BadRequestError("Service center not found");
      }

      const serviceCenterCompanyId = serviceCenter.vehicleCompanyId ?? null;

      if (!serviceCenterCompanyId) {
        throw new BadRequestError(
          "Service center does not have an associated vehicle company"
        );
      }
    } else {
      throw new BadRequestError("Service center ID is required");
    }

    const newUser = await this.#userRepository.createUserInServiceCenter({
      username,
      password: hashedPassword,
      email,
      phone,
      address,
      name,
      roleId,
      serviceCenterId,
    });

    return { ...newUser, password: undefined };
  };
}

export default AuthService;
