import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const developmentConection = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "roperito",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
};

const productionConnection = {
  connectionString: process.env.DB_URL_CONNECTION,
  /* ssl: {
    rejectUnauthorized: false,
  },*/
  allowExitOnIdle: true,
};

const connection =
  process.env.NODE_ENV === "production"
    ? productionConnection
    : developmentConection;

const pool = new pg.Pool(connection);

// Evento para manejar errores de conexión
pool.on("error", (err) => {
  console.error("Error inesperado del pool de conexiones:", err);
  process.exit(-1);
});

// Prueba inicial de conexión
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
    process.exit(-1);
  } else {
    console.log("Conexión exitosa a la base de datos");
  }
});

// Función helper para ejecutar queries
export const query = (text, params) => pool.query(text, params);

export default pool;
