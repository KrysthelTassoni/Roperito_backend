import express from 'express';
import { body } from 'express-validator';
import ratingController from '../controllers/rating.controller.js';
import validateRequest from '../middlewares/validator.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Validaciones para crear calificación
const ratingValidations = [
    body('value').isFloat({ min: 1, max: 5 }).withMessage('La calificación debe estar entre 1 y 5'),
    body('comment').optional().trim().isLength({ min: 10 }).withMessage('El comentario debe tener al menos 10 caracteres')
];

/**
 * @swagger
 * /ratings/order/{orderId}:
 *   post:
 *     summary: Crear calificación
 *     description: Crea una calificación para una orden completada
 *     tags:
 *       - Calificaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valor de la calificación (1-5)
 *                 example: 4.5
 *               comment:
 *                 type: string
 *                 description: Comentario opcional
 *                 example: "Excelente vendedor, producto en perfectas condiciones"
 *             required:
 *               - value
 *     responses:
 *       201:
 *         description: Calificación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 value:
 *                   type: number
 *                 comment:
 *                   type: string
 *                 seller_id:
 *                   type: string
 *                   format: uuid
 *                 buyer_id:
 *                   type: string
 *                   format: uuid
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es comprador de la orden
 *       404:
 *         description: Orden no encontrada
 *       409:
 *         description: Ya existe una calificación para esta orden
 *       500:
 *         description: Error interno del servidor
 */
router.post('/order/:orderId',
    ratingValidations,
    validateRequest,
    ratingController.createRating
);

/**
 * @swagger
 * /ratings/user/{userId}:
 *   get:
 *     summary: Obtener calificaciones de usuario
 *     description: Recupera las calificaciones recibidas por un usuario específico
 *     tags:
 *       - Calificaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
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
 *         description: Calificaciones del usuario
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
 *                       comment:
 *                         type: string
 *                       buyer:
 *                         type: object
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 average:
 *                   type: number
 *                   description: Promedio de las calificaciones
 *                 count:
 *                   type: integer
 *                   description: Número total de calificaciones
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/user/:userId', ratingController.getUserRatings);

/**
 * @swagger
 * /ratings/{id}:
 *   put:
 *     summary: Actualizar calificación
 *     description: Actualiza una calificación existente
 *     tags:
 *       - Calificaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la calificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valor de la calificación (1-5)
 *               comment:
 *                 type: string
 *                 description: Comentario opcional
 *             required:
 *               - value
 *     responses:
 *       200:
 *         description: Calificación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 value:
 *                   type: number
 *                 comment:
 *                   type: string
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es autor de la calificación
 *       404:
 *         description: Calificación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id',
    ratingValidations,
    validateRequest,
    ratingController.updateRating
);

/**
 * @swagger
 * /ratings/{id}:
 *   delete:
 *     summary: Eliminar calificación
 *     description: Elimina una calificación existente
 *     tags:
 *       - Calificaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la calificación
 *     responses:
 *       200:
 *         description: Calificación eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Calificación eliminada exitosamente"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es autor de la calificación
 *       404:
 *         description: Calificación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', ratingController.deleteRating);

/**
 * @swagger
 * /ratings/{id}/report:
 *   post:
 *     summary: Reportar calificación
 *     description: Reporta una calificación inapropiada
 *     tags:
 *       - Calificaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la calificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón del reporte
 *                 example: "Lenguaje inapropiado en el comentario"
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Calificación reportada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reporte enviado exitosamente"
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Calificación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/report',
    body('reason').notEmpty().withMessage('La razón del reporte es requerida'),
    validateRequest,
    ratingController.reportRating
);

export default router; 