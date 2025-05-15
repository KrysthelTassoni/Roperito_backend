import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import addressController from "../controllers/address.controller.js";

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

// Obtener regiones de Chile
router.get("/regions", addressController.getRegions);

// Obtener provincias de Chile
router.get("/provinces", addressController.getProvinces);

// Obtener comunas de Chile
router.get("/cities", addressController.getCities);

// Obtener codigo del lugar
router.get("/getCode", addressController.getCodeByName);

export default router;
