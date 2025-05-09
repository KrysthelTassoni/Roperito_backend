import express from 'express';
import metadataController from '../controllers/metadata.controller.js';

const router = express.Router();

// Obtener todas las categorías
router.get('/categories', metadataController.getCategories);

// Obtener todas las marcas
router.get('/brands', metadataController.getBrands);

// Obtener todas las tallas
router.get('/sizes', metadataController.getSizes);

// Obtener todos los colores
router.get('/colors', metadataController.getColors);

// Obtener todas las condiciones
router.get('/conditions', metadataController.getConditions);

// Obtener estadísticas generales
router.get('/stats', metadataController.getStats);

// Obtener filtros disponibles
router.get('/filters', metadataController.getFilters);

// Obtener configuración del sistema
router.get('/config', metadataController.getSystemConfig);

export default router; 