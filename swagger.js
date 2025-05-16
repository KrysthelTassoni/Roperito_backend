import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Roperito',
      version: '1.0.0',
      description: 'API para la plataforma de marketplace de ropa de segunda mano Roperito',
      contact: {
        name: 'Equipo Roperito',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Archivos donde buscar anotaciones
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs }; 