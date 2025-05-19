import express from 'express';
import { param } from 'express-validator';
import favoriteController from '../controllers/favorite.controller.js';
import validateRequest from '../middlewares/validator.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Favoritos
 *   description: Gestión de productos favoritos del usuario
 */

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Validaciones para IDs
const idValidation = [
    param('productId').isUUID().withMessage('ID de producto inválido')
];

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Obtener todos los favoritos del usuario
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   product_id:
 *                     type: string
 *                     format: uuid
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   product:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       price:
 *                         type: number
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
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
router.get('/', favoriteController.getUserFavorites);

/**
 * @swagger
 * /api/favorites/{productId}:
 *   post:
 *     summary: Agregar producto a favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del producto a agregar a favoritos
 *     responses:
 *       201:
 *         description: Producto agregado a favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 product_id:
 *                   type: string
 *                   format: uuid
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: ID de producto inválido
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
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Producto ya en favoritos
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
router.post('/:productId',
    idValidation,
    validateRequest,
    favoriteController.addFavorite
);

/**
 * @swagger
 * /api/favorites/{productId}:
 *   delete:
 *     summary: Eliminar producto de favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del producto a eliminar de favoritos
 *     responses:
 *       200:
 *         description: Producto eliminado de favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto eliminado de favoritos"
 *       400:
 *         description: ID de producto inválido
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
 *       404:
 *         description: Favorito no encontrado
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
router.delete('/:productId',
    idValidation,
    validateRequest,
    favoriteController.removeFavorite
);

/**
 * @swagger
 * /api/favorites/{productId}/check:
 *   get:
 *     summary: Verificar si un producto está en favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del producto a verificar
 *     responses:
 *       200:
 *         description: Estado del producto en favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *       400:
 *         description: ID de producto inválido
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
router.get('/:productId/check',
    idValidation,
    validateRequest,
    favoriteController.checkFavorite
);

export default router; 