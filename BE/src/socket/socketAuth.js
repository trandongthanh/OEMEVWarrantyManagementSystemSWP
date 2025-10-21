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

  const decode = jwt.verify(token, JWT_SECRET);

  socket.user = decode;

  next();
};
