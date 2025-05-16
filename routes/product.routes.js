import express from "express";
import { body } from "express-validator";
import productController from "../controllers/product.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import uploadMiddleware from "../middlewares/upload.middleware.js";

const router = express.Router();

// Validaciones para crear/actualizar producto
const productValidations = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("La descripción debe tener al menos 10 caracteres"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número positivo"),
  body("category_id").isUUID().withMessage("Categoría inválida"),
  body("size_id").isUUID().withMessage("Talla inválida"),
  body("status")
    .optional()
    .isIn(["disponible", "reservado", "vendido"])
    .withMessage("Estado no válido"),
];

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos
 *     description: Recupera una lista de todos los productos disponibles
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de productos recuperada exitosamente
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
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", productController.getAllProducts);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Buscar productos
 *     description: Busca productos por términos de búsqueda
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Término de búsqueda
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
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Error interno del servidor
 */
router.get("/search", productController.searchProducts);

/**
 * @swagger
 * /products/categories/{categoryId}:
 *   get:
 *     summary: Obtener productos por categoría
 *     description: Recupera productos filtrados por categoría
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la categoría
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
 *         description: Productos por categoría
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get("/categories/:categoryId", productController.getProductsByCategory);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     description: Recupera los detalles de un producto específico
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Detalles del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 category:
 *                   type: object
 *                 size:
 *                   type: object
 *                 seller:
 *                   type: object
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", productController.getProductById);

// Rutas protegidas
router.use(authMiddleware);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un nuevo producto
 *     description: Crea un nuevo producto con los datos proporcionados
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Camiseta manga corta"
 *               description:
 *                 type: string
 *                 example: "Camiseta de algodón en excelente estado"
 *               price:
 *                 type: number
 *                 example: 15.99
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 example: "00000000-0000-0000-0000-000000000001"
 *               size_id:
 *                 type: string
 *                 format: uuid
 *                 example: "4c89f203-cde9-4947-8b8c-38dea6e04d6b"
 *               status:
 *                 type: string
 *                 enum: [disponible, reservado, vendido]
 *                 example: "disponible"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  "/",
  uploadMiddleware.array("images", 5),
  productValidations,
  validateRequest,
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     description: Actualiza los datos de un producto existente
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               size_id:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [disponible, reservado, vendido]
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es propietario del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  "/:id",
  productValidations,
  validateRequest,
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}/images:
 *   put:
 *     summary: Actualizar imágenes de un producto
 *     description: Actualiza las imágenes de un producto existente
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Imágenes actualizadas exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es propietario del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  "/:id/images",
  uploadMiddleware.array("images", 3),
  productController.updateProductImages
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     description: Elimina un producto existente
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es propietario del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id", productController.deleteProduct);

/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Actualizar estado de un producto
 *     description: Actualiza el estado de un producto (disponible/vendido)
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [disponible, vendido]
 *                 example: "vendido"
 *     responses:
 *       200:
 *         description: Estado del producto actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - No es propietario del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  "/:id/status",
  body("status")
    .isIn(["disponible", "vendido"])
    .withMessage("Estado no válido"),
  validateRequest,
  productController.updateProductStatus
);

export default router;
