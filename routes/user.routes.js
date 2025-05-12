import express from "express";
import { body } from "express-validator";
import userController from "../controllers/user.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Validaciones para actualización de usuario
const updateValidations = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("El nombre debe tener al menos 3 caracteres"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage("Número de teléfono no válido"),
  body("address.city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La ciudad es requerida"),
  body("address.region")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La región es requerida"),
  body("address.country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El país es requerido"),
];

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

// Obtener perfil del usuario actual
router.get("/me", userController.getProfile);

// Actualizar perfil del usuario
router.put(
  "/me",
  updateValidations,
  validateRequest,
  userController.updateProfile
);

// Obtener productos del usuario
router.get("/products", userController.getUserProducts);

// Obtener favoritos del usuario
router.get("/favorites", userController.getUserFavorites);

// Obtener órdenes del usuario (como comprador)
router.get("/orders/buying", userController.getBuyingOrders);

// Obtener órdenes del usuario (como vendedor)
router.get("/orders/selling", userController.getSellingOrders);

// Obtener calificaciones recibidas
router.get("/ratings/received", userController.getReceivedRatings);

// Obtener calificaciones dadas
router.get("/ratings/given", userController.getGivenRatings);

export default router;
