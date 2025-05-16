import express from "express";
import { body } from "express-validator";
import userController from "../controllers/user.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validaciones para actualización de usuario
const updateValidations = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("El nombre debe tener al menos 3 caracteres"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage("Número de teléfono no válido"),
  body("address.city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La ciudad es requerida"),
  body("address.region")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La región es requerida"),
  body("address.country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El país es requerido"),
];

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener perfil del usuario
 *     description: Devuelve los datos del perfil del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario recuperado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                 address:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     city:
 *                       type: string
 *                     region:
 *                       type: string
 *                     country:
 *                       type: string
 *                 ratings:
 *                   type: object
 *                   properties:
 *                     average:
 *                       type: number
 *                     count:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/me", userController.getProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     description: Actualiza los datos del perfil del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez Actualizado"
 *               phone:
 *                 type: string
 *                 example: "+56912345678"
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: "Santiago"
 *                   region:
 *                     type: string
 *                     example: "Metropolitana"
 *                   country:
 *                     type: string
 *                     example: "Chile"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                 address:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     city:
 *                       type: string
 *                     region:
 *                       type: string
 *                     country:
 *                       type: string
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  "/me",
  updateValidations,
  validateRequest,
  userController.updateProfile
);

/**
 * @swagger
 * /users/products:
 *   get:
 *     summary: Obtener productos del usuario
 *     description: Recupera la lista de productos publicados por el usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de productos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       price:
 *                         type: number
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/products", userController.getUserProducts);

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Obtener favoritos del usuario
 *     description: Recupera la lista de productos marcados como favoritos por el usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de favoritos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       product_id:
 *                         type: string
 *                         format: uuid
 *                       product:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image_url:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/favorites", userController.getUserFavorites);

/**
 * @swagger
 * /users/orders/buying:
 *   get:
 *     summary: Obtener órdenes de compra
 *     description: Recupera las órdenes de compra del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de órdenes de compra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       product:
 *                         type: object
 *                       seller:
 *                         type: object
 *                       price:
 *                         type: number
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/orders/buying", userController.getBuyingOrders);

/**
 * @swagger
 * /users/orders/selling:
 *   get:
 *     summary: Obtener órdenes de venta
 *     description: Recupera las órdenes de venta del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de órdenes de venta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       product:
 *                         type: object
 *                       buyer:
 *                         type: object
 *                       price:
 *                         type: number
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/orders/selling", userController.getSellingOrders);

/**
 * @swagger
 * /users/ratings/received:
 *   get:
 *     summary: Obtener calificaciones recibidas
 *     description: Recupera las calificaciones recibidas por el usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de calificaciones recibidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       value:
 *                         type: number
 *                       buyer:
 *                         type: object
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 average:
 *                   type: number
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/ratings/received", userController.getReceivedRatings);

/**
 * @swagger
 * /users/ratings/given:
 *   get:
 *     summary: Obtener calificaciones dadas
 *     description: Recupera las calificaciones otorgadas por el usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de calificaciones dadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       value:
 *                         type: number
 *                       seller:
 *                         type: object
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/ratings/given", userController.getGivenRatings);

export default router;
