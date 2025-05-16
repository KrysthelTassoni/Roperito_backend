import express from "express";
import { body } from "express-validator";
import orderController from "../controllers/order.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Validaciones para crear orden
const orderValidations = [
  body("product_id").isUUID().withMessage("ID de producto inválido"),
];

// enviar mensaje a vendedor
router.post("/message", validateRequest, orderController.sendMessage);

// Vendedor recibe el mensaje
router.get("/message", orderController.getMessages);

// Responder mensaje al comprador
router.put("/message", validateRequest, orderController.replyMessage);

// Verificar si el comprador ya envió un mensje
router.get("/messagesent", orderController.checkIfPotentialBuyer);

// Obtener Posibles compradores de un producto en especifico
router.get("/potential-buyers/:product_id", orderController.getPotentialBuyer);

// Crear nueva orden
router.post(
  "/",
  orderValidations,
  validateRequest,
  orderController.createOrder
);

// Obtener orden específica
router.get("/:id", orderController.getOrderById);

// Cancelar orden
router.delete("/:product_id", orderController.deleteOrderByProduct);

export default router;
