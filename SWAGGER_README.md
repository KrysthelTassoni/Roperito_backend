# Documentación de API con Swagger

Este proyecto utiliza Swagger para documentar la API RESTful. A continuación, se detalla cómo se ha implementado y cómo se puede extender la documentación.

## Acceso a la documentación

La documentación de la API está disponible en:

```
http://localhost:3001/api-docs
```

## Estructura de la implementación

La documentación con Swagger se ha implementado con los siguientes archivos:

1. `swagger.js`: Archivo principal de configuración que define las opciones de Swagger y configura la ruta `/api-docs`.
2. `swagger/definitions.js`: Definiciones de esquemas (schemas) para los modelos principales (User, Product, Order, Error).
3. Comentarios en archivos de rutas: Cada endpoint está documentado directamente en los archivos de rutas usando comentarios JSDoc con anotaciones de Swagger.

## Cómo documentar nuevos endpoints

Para documentar nuevos endpoints, sigue estos pasos:

1. Agrega comentarios JSDoc con la sintaxis de Swagger en el archivo de rutas correspondiente:

```javascript
/**
 * @swagger
 * /api/ruta/ejemplo:
 *   get:
 *     summary: Breve descripción de lo que hace el endpoint
 *     tags: [Categoría]
 *     parameters:
 *       - in: query
 *         name: parametro
 *         schema:
 *           type: string
 *         description: Descripción del parámetro
 *     responses:
 *       200:
 *         description: Descripción de la respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 propiedad:
 *                   type: string
 */
router.get("/ejemplo", controlador.metodo);
```

2. Para rutas que requieren autenticación, agrega el objeto `security`:

```javascript
/**
 * @swagger
 * /api/ruta/protegida:
 *   post:
 *     summary: Endpoint protegido
 *     tags: [Categoría]
 *     security:
 *       - bearerAuth: []
 *     // resto de la documentación
 */
router.post("/protegida", middleware, controlador.metodo);
```

## Estructura de la documentación

La documentación sigue esta estructura:

- **Tags**: Agrupaciones lógicas de endpoints (por ejemplo: Autenticación, Productos, Órdenes).
- **Schemas**: Definiciones de modelos de datos utilizados en la API.
- **Endpoints**: Documentación detallada de cada ruta, incluyendo:
  - Método HTTP
  - Parámetros
  - Cuerpo de la solicitud
  - Respuestas posibles
  - Ejemplos

## Modelos principales documentados

- **User**: Modelo de usuario con propiedades como id, name, email, etc.
- **Product**: Modelo de producto con titulo, descripción, precio, categoría, etc.
- **Order**: Modelo de orden de compra
- **Error**: Estructura estándar de errores

## Extensión de la documentación

Para extender la documentación:

1. Agrega nuevos schemas en `swagger/definitions.js` si es necesario
2. Documenta nuevos endpoints en los archivos de rutas correspondientes
3. Si agregas nuevas categorías de endpoints, define nuevos tags

## Recomendaciones

- Mantén la documentación actualizada cuando modifiques los endpoints
- Verifica que los schemas reflejen correctamente los modelos actuales
- Usa ejemplos realistas para facilitar la comprensión
- Documenta todos los posibles códigos de respuesta y errores 