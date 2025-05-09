import express from 'express';
import { param } from 'express-validator';
import favoriteController from '../controllers/favorite.controller.js';
import validateRequest from '../middlewares/validator.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Validaciones para IDs
const idValidation = [
    param('productId').isUUID().withMessage('ID de producto inválido')
];

// Obtener todos los favoritos del usuario
router.get('/', favoriteController.getUserFavorites);

// Agregar producto a favoritos
router.post('/:productId',
    idValidation,
    validateRequest,
    favoriteController.addFavorite
);

// Eliminar producto de favoritos
router.delete('/:productId',
    idValidation,
    validateRequest,
    favoriteController.removeFavorite
);

// Verificar si un producto está en favoritos
router.get('/:productId/check',
    idValidation,
    validateRequest,
    favoriteController.checkFavorite
);

export default router; 