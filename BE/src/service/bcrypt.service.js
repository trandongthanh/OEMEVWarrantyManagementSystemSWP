const bcrypt = require("bcrypt");

class BcryptService {
  async hash(plainText) {
    const saltRound = 10;
    return await bcrypt.hash(plainText, saltRound);
  }

  async compare(plainText, hashed) {
    return await bcrypt.compare(plainText, hashed);
  }
}

module.exports = new BcryptService();
