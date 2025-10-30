import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const socketAuth = (socket, next) => {
  console.log("Authenticating socket...");

  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: Token not provided"));
  }

  try {
    const decode = jwt.verify(token, JWT_SECRET);
    socket.user = decode;
    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid token"));
  }
};

// Optional authentication - allows both authenticated and anonymous connections
export const optionalSocketAuth = (socket, next) => {
  console.log("Optional authentication for socket...");

  const token = socket.handshake.auth.token;

  if (token) {
    try {
      const decode = jwt.verify(token, JWT_SECRET);
      socket.user = decode;
      socket.isAuthenticated = true;
      console.log("Socket authenticated as:", decode.userId);
    } catch (error) {
      console.log("Invalid token provided, treating as guest");
      socket.isAuthenticated = false;
    }
  } else {
    socket.isAuthenticated = false;
    console.log("No token provided, treating as guest");
  }

  next();
};
