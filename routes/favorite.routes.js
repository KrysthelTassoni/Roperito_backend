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

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Obtener favoritos del usuario
 *     description: Recupera todos los productos marcados como favoritos por el usuario autenticado
 *     tags:
 *       - Favoritos
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
 *         description: Lista de favoritos
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
router.get('/', favoriteController.getUserFavorites);

/**
 * @swagger
 * /favorites/{productId}:
 *   post:
 *     summary: Agregar producto a favoritos
 *     description: Agrega un producto a la lista de favoritos del usuario
 *     tags:
 *       - Favoritos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto a agregar a favoritos
 *     responses:
 *       201:
 *         description: Producto agregado a favoritos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                 product_id:
 *                   type: string
 *                   format: uuid
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 *       409:
 *         description: El producto ya está en favoritos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:productId',
    idValidation,
    validateRequest,
    favoriteController.addFavorite
);

/**
 * @swagger
 * /favorites/{productId}:
 *   delete:
 *     summary: Eliminar producto de favoritos
 *     description: Elimina un producto de la lista de favoritos del usuario
 *     tags:
 *       - Favoritos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto a eliminar de favoritos
 *     responses:
 *       200:
 *         description: Producto eliminado de favoritos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto eliminado de favoritos"
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Favorito no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:productId',
    idValidation,
    validateRequest,
    favoriteController.removeFavorite
);

/**
 * @swagger
 * /favorites/{productId}/check:
 *   get:
 *     summary: Verificar si un producto está en favoritos
 *     description: Verifica si un producto específico está en la lista de favoritos del usuario
 *     tags:
 *       - Favoritos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto a verificar
 *     responses:
 *       200:
 *         description: Estado del favorito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:productId/check',
    idValidation,
    validateRequest,
    favoriteController.checkFavorite
);

export default router; 