import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import addressController from "../controllers/address.controller.js";

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

/**
 * @swagger
 * /address/regions:
 *   get:
 *     summary: Obtener regiones de Chile
 *     description: Recupera la lista de regiones de Chile
 *     tags:
 *       - Direcciones
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
 *                   code:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/regions", addressController.getRegions);

/**
 * @swagger
 * /address/provinces:
 *   get:
 *     summary: Obtener provincias de Chile
 *     description: Recupera la lista de provincias de Chile
 *     tags:
 *       - Direcciones
 *     security:
 *       - bearerAuth: []
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
 *       500:
 *         description: Error interno del servidor
 */
router.get("/provinces", addressController.getProvinces);

/**
 * @swagger
 * /address/cities:
 *   get:
 *     summary: Obtener comunas de Chile
 *     description: Recupera la lista de comunas de Chile
 *     tags:
 *       - Direcciones
 *     security:
 *       - bearerAuth: []
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
 *       500:
 *         description: Error interno del servidor
 */
router.get("/cities", addressController.getCities);

/**
 * @swagger
 * /address/getCode:
 *   get:
 *     summary: Obtener código del lugar
 *     description: Recupera el código de un lugar por su nombre
 *     tags:
 *       - Direcciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del lugar
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
 *       404:
 *         description: Lugar no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/getCode", addressController.getCodeByName);

export default router;
