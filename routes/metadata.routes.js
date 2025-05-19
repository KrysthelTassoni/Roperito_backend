import express from "express";
import metadataController from "../controllers/metadata.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Metadatos
 *   description: Información de categorías, tallas y filtros
 */

/**
 * @swagger
 * /api/metadata/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Metadatos]
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
 *                   parent_id:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/categories", metadataController.getCategories);

/**
 * @swagger
 * /api/metadata/sizes:
 *   get:
 *     summary: Obtener todas las tallas
 *     tags: [Metadatos]
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
 *                   category_id:
 *                     type: string
 *                     format: uuid
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/sizes", metadataController.getSizes);

/**
 * @swagger
 * /api/metadata/filters:
 *   get:
 *     summary: Obtener filtros disponibles
 *     tags: [Metadatos]
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
 *                       category_id:
 *                         type: string
 *                         format: uuid
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/filters", metadataController.getFilters);

export default router;
