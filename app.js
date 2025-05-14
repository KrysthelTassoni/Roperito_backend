import express from "express";
import logger from "morgan";
import cors from "cors";

// Importar rutas
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import metadataRoutes from "./routes/metadata.routes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(cors());
app.set("port", port);

//LLAMAR RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/metadata", metadataRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

export default app;

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

//200 - RESPUESTA EXITOSA
//404 - URL NO EXISTE
//500 - ERROR INTERNO DEL SERVIDOR
