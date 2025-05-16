import express from 'express';
import { body } from 'express-validator';
import orderController from '../controllers/order.controller.js';
import validateRequest from '../middlewares/validator.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Validaciones para crear orden
const orderValidations = [
    body('product_id').isUUID().withMessage('ID de producto inválido'),
    body('shipping_address').notEmpty().withMessage('La dirección de envío es requerida'),
    body('payment_method').isIn(['efectivo', 'transferencia']).withMessage('Método de pago no válido')
];

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear una orden
 *     description: Crea una nueva orden de compra para un producto
 *     tags:
 *       - Órdenes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del producto a comprar
 *               shipping_address:
 *                 type: string
 *                 description: Dirección de envío
 *                 example: "Av. Ejemplo 123, Santiago, Chile"
 *               payment_method:
 *                 type: string
 *                 enum: [efectivo, transferencia]
 *                 description: Método de pago
 *             required:
 *               - product_id
 *               - shipping_address
 *               - payment_method
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 product:
 *                   type: object
 *                 seller:
 *                   type: object
 *                 buyer:
 *                   type: object
 *                 price:
 *                   type: number
 *                 status:
 *                   type: string
 *                 shipping_address:
 *                   type: string
 *                 payment_method:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/',
    orderValidations,
    validateRequest,
    orderController.createOrder
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener orden
 *     description: Recupera los detalles de una orden específica
 *     tags:
 *       - Órdenes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Detalles de la orden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 product:
 *                   type: object
 *                 seller:
 *                   type: object
 *                 buyer:
 *                   type: object
 *                 price:
 *                   type: number
 *                 status:
 *                   type: string
 *                 shipping_address:
 *                   type: string
 *                 payment_method:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es comprador ni vendedor
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Actualizar estado de orden
 *     description: Actualiza el estado de una orden existente
 *     tags:
 *       - Órdenes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [pendiente, confirmada, enviada, entregada, cancelada]
 *                 description: Nuevo estado de la orden
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es el vendedor
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/status',
    body('status').isIn(['pendiente', 'confirmada', 'enviada', 'entregada', 'cancelada'])
        .withMessage('Estado no válido'),
    validateRequest,
    orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/{id}/confirm-delivery:
 *   post:
 *     summary: Confirmar recepción
 *     description: Confirma la recepción de una orden por parte del comprador
 *     tags:
 *       - Órdenes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Recepción confirmada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Entrega confirmada exitosamente"
 *                 order:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es el comprador
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/confirm-delivery',
    orderController.confirmDelivery
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancelar orden
 *     description: Cancela una orden existente
 *     tags:
 *       - Órdenes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               reason:
 *                 type: string
 *                 description: Razón de la cancelación
 *                 example: "El producto ya no está disponible"
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Orden cancelada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Orden cancelada exitosamente"
 *                 order:
 *                   type: object
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es participante de la orden
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/cancel',
    body('reason').notEmpty().withMessage('La razón de cancelación es requerida'),
    validateRequest,
    orderController.cancelOrder
);

export default router; 