// swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Roperito",
      version: "1.0.0",
      description: "API para el marketplace de ropa de segunda mano Roperito",
    },
    servers: [
      {
        url: "https://roperito-backend.onrender.com/",
        description: "Servidor de desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Rutas que Swagger debe escanear para encontrar documentación
  apis: [
    "./routes/*.js",
    "./controllers/*.js",
    "./models/*.js",
    "./swagger/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(
    "Documentación de Swagger disponible en http://localhost:3001/api-docs"
  );
};

export default setupSwagger;
