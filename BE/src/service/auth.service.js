const UserRepository = require("../repository/user.repository");
const { BadRequestError, ConflictError } = require("../error");
const BcryptService = require("./bcrypt.service");
const TokenService = require("./token.service");
const RoleRepository = require("../repository/role.repository");

class AuthService {
  constructor() {
    this.userRepository = UserRepository;
    this.bcryptService = BcryptService;
    this.tokenService = TokenService;
    this.roleRepository = RoleRepository;
  }

  registerStaffForAdmin = async (userData) => {
    const {
      username,
      password,
      phone,
      email,
      name,
      address,
      roleId,
      serviceCenterId,
    } = userData;

    console.log("UserData", userData);

    const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validatePhone = /^\d{10}$/;

    if (!validateEmail.test(email) || !validatePhone.test(phone)) {
      throw new BadRequestError("Inappropriate email or phone");
    }

    if (!address || !name || !roleId) {
      throw new BadRequestError(
        "Address, name, roleId, serviceCenterId is required"
      );
    }

    const existingUser = await this.userRepository.findUserByUsername({
      username,
    });

    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const hashedPassword = await this.bcryptService.hash(password);

    const newUser = await this.userRepository.createUser({
      ...userData,
      password: hashedPassword,
      roleId,
    });

    if (newUser) {
      return true;
    }
  };

  login = async (userData) => {
    const { username, password } = userData;

    const existingUser = await this.userRepository.findUserByUsername({
      username,
    });

    console.log(existingUser);

    if (!existingUser) {
      throw new Error("User is not exists");
    }

    const isMatch = await this.bcryptService.compare(
      password,
      existingUser.password
    );

    if (!isMatch) {
      throw new Error("Password is false");
    }

    const token = this.tokenService.generateToken({ user: existingUser });

    existingUser.password = undefined;

    return {
      user: existingUser,
      token,
    };
  };
}

module.exports = new AuthService();
