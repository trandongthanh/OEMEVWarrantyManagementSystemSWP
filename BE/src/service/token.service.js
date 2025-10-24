import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();

const SECRET_KEY = process.env.JWT_SECRET;
class TokenService {
  generateToken({ userId, roleName, serviceCenterId, companyId }) {
    const payload = { userId, roleName, serviceCenterId, companyId };

    return jwt.sign(payload, SECRET_KEY, {
      expiresIn: "5h",
    });
  }

  verify(token) {
    const decode = jwt.verify(token, SECRET_KEY);

    return decode;
  }
}

export default TokenService;
