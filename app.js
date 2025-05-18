// app.js
import express from "express";
import logger from "morgan";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setIO, authenticateSocket } from "./socket.js";
import dotenv from "dotenv";
dotenv.config();

// Importar rutas
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import metadataRoutes from "./routes/metadata.routes.js";
import addressRoutes from "./routes/address.routes.js";

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(cors());
app.set("port", port);

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/address", addressRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Servidor HTTP + Socket.IO
if (process.env.NODE_ENV !== "test") {
  const server = createServer(app); // Crear servidor HTTP
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Ajusta a tu frontend en producción
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    try {
      const payload = authenticateSocket(socket);
      socket.userId = payload.userId;
      console.log("Socket autenticado. userId:", socket.userId);
    } catch (error) {
      console.log("Autenticación de socket fallida:", error.message);
      socket.disconnect(); // Desconectamos si el token no es válido
      return;
    }

    console.log("Nuevo cliente conectado:", socket.id);

    socket.on("mensaje", (data) => {
      console.log("Mensaje recibido:", data);
      socket.broadcast.emit("mensaje", data);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  setIO(io);

  server.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

export default app;
