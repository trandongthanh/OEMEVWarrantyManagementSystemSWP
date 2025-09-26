const { NotFoundError } = require("../error");
const UserRepository = require("../repository/user.repository");

class UserService {
  constructor() {
    this.userRepository = UserRepository;
  }

  findById = async (userData) => {
    const { userId } = userData;

    const existingUser = await this.userRepository.findUserById({ id: userId });

    return existingUser;
  };

  findUserByEmailOrPhone = async (userIdentifier) => {
    const { customerIdentifier } = userIdentifier;

    const existingUser = await this.userRepository.findUserByEmailOrPhone({
      identifier: customerIdentifier,
    });

    if (!existingUser) {
      throw new NotFoundError("User is not found");
    }

    return existingUser;
  };
}

module.exports = new UserService();
