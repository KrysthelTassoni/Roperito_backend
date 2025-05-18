import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

let io;

export const setIO = (ioInstance) => {
  io = ioInstance;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO no inicializado");
  return io;
};

export function authenticateSocket(socket) {
  const token = socket.handshake.auth.token;
  if (!token) throw new Error("Token no proporcionado");
  return jwt.verify(token, JWT_SECRET);
}
