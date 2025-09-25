class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

class AuthorizationError extends ApiError {
  constructor(message = "Authorization header missing") {
    super(message, 401);
  }
}

class TokenMissing extends ApiError {
  constructor(message = "Token missing from Authorization header") {
    super(message, 401);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = "You do not have permission") {
    super(message, 403);
  }
}

module.exports = {
  BadRequestError,
  ConflictError,
  NotFoundError,
  AuthorizationError,
  TokenMissing,
  ForbiddenError,
};
