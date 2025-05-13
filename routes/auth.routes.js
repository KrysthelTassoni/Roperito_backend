import express from "express";
import { body } from "express-validator";
import authController from "../controllers/auth.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";

const router = express.Router();

// Validaciones para el registro
const registerValidations = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("El nombre debe tener al menos 3 caracteres"),
  body("email").isEmail().withMessage("Email no válido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage("Número de teléfono no válido"),
];

// Validaciones para el login
const loginValidations = [
  body("email").isEmail().withMessage("Email no válido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
];

// Rutas
router.post(
  "/register",
  registerValidations,
  validateRequest,
  authController.register
);
router.post("/login", loginValidations, validateRequest, authController.login);

export default router;
