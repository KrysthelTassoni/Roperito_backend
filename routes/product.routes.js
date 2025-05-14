import express from "express";
import { body } from "express-validator";
import productController from "../controllers/product.controller.js";
import validateRequest from "../middlewares/validator.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import uploadMiddleware from "../middlewares/upload.middleware.js";

const router = express.Router();

// Validaciones para crear/actualizar producto
const productValidations = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("La descripción debe tener al menos 10 caracteres"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número positivo"),
  body("category_id").isUUID().withMessage("Categoría inválida"),
  body("size_id").isUUID().withMessage("Talla inválida"),
  body("status")
    .optional()
    .isIn(["disponible", "reservado", "vendido"])
    .withMessage("Estado no válido"),
];

// Rutas públicas
router.get("/", productController.getAllProducts);
router.get("/search", productController.searchProducts);
router.get("/categories/:categoryId", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

// Rutas protegidas
router.use(authMiddleware);

// Crear producto
router.post(
  "/",
  uploadMiddleware.array("images", 5),
  productValidations,
  validateRequest,
  productController.createProduct
);

// Actualizar producto
router.put(
  "/:id",
  productValidations,
  validateRequest,
  productController.updateProduct
);

// Actualizar imágenes del producto
router.put(
  "/:id/images",
  uploadMiddleware.array("images", 3),
  productController.updateProductImages
);

// Eliminar producto
router.delete("/:id", productController.deleteProduct);

// Marcar como vendido/reservado
router.patch(
  "/:id/status",
  body("status")
    .isIn(["disponible", "reservado", "vendido"])
    .withMessage("Estado no válido"),
  validateRequest,
  productController.updateProductStatus
);

export default router;
