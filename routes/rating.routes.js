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

// Crear calificación para una orden
router.post('/order/:orderId',
    ratingValidations,
    validateRequest,
    ratingController.createRating
);

// Obtener calificaciones de un usuario
router.get('/user/:userId', ratingController.getUserRatings);

// Actualizar una calificación
router.put('/:id',
    ratingValidations,
    validateRequest,
    ratingController.updateRating
);

// Eliminar una calificación
router.delete('/:id', ratingController.deleteRating);

// Reportar una calificación
router.post('/:id/report',
    body('reason').notEmpty().withMessage('La razón del reporte es requerida'),
    validateRequest,
    ratingController.reportRating
);

export default router; 