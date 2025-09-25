const {
  AuthorizationError,
  TokenMissing,
  ForbiddenError,
} = require("../src/error");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");

function authencationWithJwtToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new AuthorizationError());
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new TokenMissing();
  }

  const decodePayload = jwt.verify(token, SECRET_KEY);

  req.user = decodePayload;

  next();
}

function authorizeWithRole(allowedRoled) {
  return (req, res, next) => {
    const role = req.user.role;

    if (!allowedRoled.includes(role)) {
      next(new ForbiddenError());
    }

    next();
  };
}

module.exports = {
  authencationWithJwtToken,
  authorizeWithRole,
};
