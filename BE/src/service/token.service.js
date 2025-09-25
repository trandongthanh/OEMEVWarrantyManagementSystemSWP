const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

class TokenService {
  generateToken({ user }) {
    const payload = { userId: user.userId, role: user.role.roleName };

    return jwt.sign(payload, SECRET_KEY, {
      expiresIn: "5h",
    });
  }
}

module.exports = new TokenService();
