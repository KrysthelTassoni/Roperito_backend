import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Log para debug
console.log('Variables de entorno cargadas:', {
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_DATABASE,
  port: process.env.PORT
});

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import metadataRoutes from './routes/metadata.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/metadata', metadataRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error detallado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Función para encontrar un puerto disponible
const findAvailablePort = async (startPort) => {
  const maxPort = 65535;
  const portIncrement = 1;

  for (let port = startPort; port <= maxPort; port += portIncrement) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          server.close();
          resolve(port);
        });
        server.on('error', reject);
      });
      return port;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error;
    }
  }
  throw new Error('No se encontró ningún puerto disponible');
};

// Iniciar el servidor
const startServer = async () => {
  try {
    const defaultPort = parseInt(process.env.PORT || '3001', 10);
    const port = await findAvailablePort(defaultPort);
    
    app.listen(port, () => {
      console.log(`Servidor corriendo en el puerto ${port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer(); 