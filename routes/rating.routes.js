import express from "express";
import { body } from "express-validator";
import ratingController from "../controllers/rating.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calificaciones
 *   description: Gestión de calificaciones entre usuarios
 */

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Validaciones para crear calificación
const ratingValidations = [
  body("value")
    .isFloat({ min: 1, max: 5 })
    .withMessage("La calificación debe estar entre 1 y 5"),
];

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Crear una nueva calificación
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *               - order_id
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4.5
 *               order_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la orden que será calificada
 *     responses:
 *       201:
 *         description: Calificación creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Calificación registrada con éxito"
 *                 ratingId:
 *                   type: string
 *                   format: uuid
 *                   description: ID de la calificación creada
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
router.post(
  "/",
  ratingValidations,
  validateRequest,
  ratingController.createRating
);

/**
 * @swagger
 * /api/ratings/user/{userId}:
 *   get:
 *     summary: Obtener calificaciones de un usuario
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *           pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 *         required: true
 *         description: ID del usuario (formato UUID)
 *     responses:
 *       200:
 *         description: Resumen de calificaciones del vendedor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sellerId:
 *                   type: string
 *                   format: uuid
 *                 totalRatings:
 *                   type: integer
 *                 averageRating:
 *                   type: number
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
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
router.get("/user/:userId", ratingController.getRatings);


/**
 * @swagger
 * /api/ratings/ifrating/{sellerId}:
 *   get:
 *     summary: Verificar si el comprador autenticado ya valoró al vendedor especificado
 *     description: Este endpoint permite a un comprador verificar si ya ha calificado a un vendedor específico. No permite a vendedores verificar si han sido calificados por un comprador específico.
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *           format: uuid
 *           pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 *         required: true
 *         description: ID del vendedor (formato UUID)
 *     responses:
 *       200:
 *         description: Información sobre si el comprador ya valoró al vendedor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasRated:
 *                   type: boolean
 *                   description: true si el comprador ya valoró al vendedor, false en caso contrario
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
// Verificar si el comprador ya valoró al vendedor
router.get("/ifrating", ratingController.ifRatingSeller);

export default router;
