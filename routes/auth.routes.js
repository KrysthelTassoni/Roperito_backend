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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Crea una nueva cuenta de usuario con los datos proporcionados
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del usuario
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 description: Contraseña (mínimo 6 caracteres)
 *                 example: password123
 *               phone:
 *                 type: string
 *                 description: Número de teléfono (opcional)
 *                 example: "+56912345678"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 token:
 *                   type: string
 *       409:
 *         description: El email ya está registrado
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  "/register",
  registerValidations,
  validateRequest,
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario con email y contraseña
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: password123
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 address:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     city:
 *                       type: string
 *                     region:
 *                       type: string
 *                     country:
 *                       type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post("/login", loginValidations, validateRequest, authController.login);

export default router;
