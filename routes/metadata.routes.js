import express from "express";
import metadataController from "../controllers/metadata.controller.js";

const router = express.Router();

/**
 * @swagger
 * /metadata/categories:
 *   get:
 *     summary: Obtener categorías
 *     description: Recupera la lista de todas las categorías disponibles
 *     tags:
 *       - Metadatos
 *     responses:
 *       200:
 *         description: Lista de categorías
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
 *                   name:
 *                     type: string
 *                     example: "Camisetas"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error interno del servidor
 */
router.get("/categories", metadataController.getCategories);

/**
 * @swagger
 * /metadata/sizes:
 *   get:
 *     summary: Obtener tallas
 *     description: Recupera la lista de todas las tallas disponibles
 *     tags:
 *       - Metadatos
 *     responses:
 *       200:
 *         description: Lista de tallas
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
 *                   name:
 *                     type: string
 *                     example: "M"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error interno del servidor
 */
router.get("/sizes", metadataController.getSizes);

/**
 * @swagger
 * /metadata/filters:
 *   get:
 *     summary: Obtener filtros
 *     description: Recupera los filtros disponibles para la búsqueda de productos
 *     tags:
 *       - Metadatos
 *     responses:
 *       200:
 *         description: Filtros disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                 sizes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                 priceRanges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                       label:
 *                         type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/filters", metadataController.getFilters);

// Ruta que será eliminada más adelante
router.get("/regions", metadataController.getRegions);

export default router;
