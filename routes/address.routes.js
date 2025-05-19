import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import addressController from "../controllers/address.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Direcciones
 *   description: Gestión de información geográfica
 */

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

/**
 * @swagger
 * /api/address/regions:
 *   get:
 *     summary: Obtener regiones de Chile
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de regiones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
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
router.get("/regions", addressController.getRegions);

/**
 * @swagger
 * /api/address/provinces:
 *   get:
 *     summary: Obtener provincias de Chile
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: string
 *         description: ID de la región (opcional)
 *     responses:
 *       200:
 *         description: Lista de provincias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   region_id:
 *                     type: string
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
router.get("/provinces", addressController.getProvinces);

/**
 * @swagger
 * /api/address/cities:
 *   get:
 *     summary: Obtener comunas de Chile
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province_id
 *         schema:
 *           type: string
 *         description: ID de la provincia (opcional)
 *     responses:
 *       200:
 *         description: Lista de comunas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   province_id:
 *                     type: string
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
router.get("/cities", addressController.getCities);

/**
 * @swagger
 * /api/address/getCode:
 *   get:
 *     summary: Obtener código del lugar por nombre
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre del lugar (región, provincia o comuna)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [region, province, city]
 *         required: true
 *         description: Tipo de lugar
 *     responses:
 *       200:
 *         description: Código del lugar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 name:
 *                   type: string
 *       400:
 *         description: Parámetros inválidos
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
 *         description: Lugar no encontrado
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
router.get("/getCode", addressController.getCodeByName);

export default router;
