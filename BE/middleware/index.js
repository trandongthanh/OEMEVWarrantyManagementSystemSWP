import { BadRequestError, ForbiddenError } from "../src/error/index.js";
import TokenService from "../src/service/token.service.js";

export function authentication(req, res, next) {
  const requestHeader = req.headers.authorization;

  if (!requestHeader) {
    throw new BadRequestError("Header is not contain information");
  }

  const token = requestHeader.split(" ")[1];

  if (!token) {
    throw new BadRequestError("You missing token in heaer");
  }

  const tokenService = new TokenService();

  const decode = tokenService.verify(token);

  if (!decode) {
    throw new BadRequestError("Token is invalid");
  }

  // console.log(decode);

  req.user = decode;

  next();
}

export function authorizationByRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.roleName)) {
      throw new ForbiddenError();
    }

    next();
  };
}

export function hanldeError(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error";
  const status = statusCode !== 500 ? "error" : "fail";

  res.status(statusCode).json({
    status: status,
    message: message,
  });
}
