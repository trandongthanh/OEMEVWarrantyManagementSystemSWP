import bcrypt from "bcrypt";

class HashService {
  hash({ string }) {
    const saltRound = 10;
    return bcrypt.hash(string, saltRound);
  }

  compare({ string, hashed }) {
    return bcrypt.compare(string, hashed);
  }
}

export default HashService;
