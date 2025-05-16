import express from "express";
import metadataController from "../controllers/metadata.controller.js";

const router = express.Router();

// Obtener todas las categorías
router.get("/categories", metadataController.getCategories);

// Obtener todas las tallas
router.get("/sizes", metadataController.getSizes);

// Obtener filtros disponibles
router.get("/filters", metadataController.getFilters);

export default router;
