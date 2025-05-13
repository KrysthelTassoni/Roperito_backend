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

// Crear nueva orden
router.post('/',
    orderValidations,
    validateRequest,
    orderController.createOrder
);

// Obtener orden específica
router.get('/:id', orderController.getOrderById);

// Actualizar estado de la orden
router.patch('/:id/status',
    body('status').isIn(['pendiente', 'confirmada', 'enviada', 'entregada', 'cancelada'])
        .withMessage('Estado no válido'),
    validateRequest,
    orderController.updateOrderStatus
);

// Confirmar recepción de orden
router.post('/:id/confirm-delivery',
    orderController.confirmDelivery
);

// Cancelar orden
router.post('/:id/cancel',
    body('reason').notEmpty().withMessage('La razón de cancelación es requerida'),
    validateRequest,
    orderController.cancelOrder
);

export default router; 