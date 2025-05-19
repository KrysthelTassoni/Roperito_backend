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

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión del perfil y datos del usuario
 */

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 address:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *                     region:
 *                       type: string
 *                     country:
 *                       type: string
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", userController.getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [Usuarios]
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
 *                 example: José García
 *               phone:
 *                 type: string
 *                 example: "+56912345678"
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: Santiago
 *                   region:
 *                     type: string
 *                     example: Metropolitana
 *                   country:
 *                     type: string
 *                     example: Chile
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 address:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *                     region:
 *                       type: string
 *                     country:
 *                       type: string
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/me",
  updateValidations,
  validateRequest,
  userController.updateProfile
);

/**
 * @swagger
 * /api/users/products:
 *   get:
 *     summary: Obtener productos del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/products", userController.getUserProducts);

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Obtener favoritos del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos favoritos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   product_id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   price:
 *                     type: number
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/favorites", userController.getUserFavorites);

/**
 * @swagger
 * /api/users/orders/buying:
 *   get:
 *     summary: Obtener órdenes del usuario como comprador
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes como comprador
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/orders/buying", userController.getBuyingOrders);

/**
 * @swagger
 * /api/users/orders/selling:
 *   get:
 *     summary: Obtener órdenes del usuario como vendedor
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes como vendedor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/orders/selling", userController.getSellingOrders);

/**
 * @swagger
 * /api/users/ratings/received:
 *   get:
 *     summary: Obtener calificaciones recibidas
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de calificaciones recibidas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   value:
 *                     type: number
 *                   comment:
 *                     type: string
 *                   rater_id:
 *                     type: string
 *                   rater_name:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/ratings/received", userController.getReceivedRatings);

/**
 * @swagger
 * /api/users/ratings/given:
 *   get:
 *     summary: Obtener calificaciones dadas
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de calificaciones dadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   value:
 *                     type: number
 *                   comment:
 *                     type: string
 *                   rated_id:
 *                     type: string
 *                   rated_name:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/ratings/given", userController.getGivenRatings);

export default router;
