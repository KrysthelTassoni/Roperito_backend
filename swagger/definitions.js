/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del usuario
 *         name:
 *           type: string
 *           description: Nombre completo del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *         password:
 *           type: string
 *           description: Contraseña del usuario (no se devuelve en respuestas)
 *         phone:
 *           type: string
 *           description: Número de teléfono del usuario
 *         is_active:
 *           type: boolean
 *           description: Indica si el usuario está activo
 *           default: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización del usuario
 *       example:
 *         id: 550e8400-e29b-41d4-a716-446655440000
 *         name: Juan Pérez
 *         email: juan@example.com
 *         phone: "+5491155556666"
 *         is_active: true
 *         created_at: "2023-01-01T12:00:00Z"
 *         updated_at: "2023-01-01T12:00:00Z"
 * 
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - category_id
 *         - size_id
 *         - user_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del producto
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *           description: Título del producto
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Descripción detallada del producto
 *         price:
 *           type: integer
 *           minimum: 0
 *           description: Precio del producto
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: ID de la categoría del producto
 *         size_id:
 *           type: string
 *           format: uuid
 *           description: ID de la talla del producto
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario propietario del producto
 *         status:
 *           type: string
 *           enum: [disponible, vendido]
 *           description: Estado actual del producto
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del producto
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización del producto
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Indica si el producto está activo
 *         favorites_count:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: Número de veces que el producto ha sido marcado como favorito
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la imagen
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL de la imagen
 *               order:
 *                 type: integer
 *                 description: Orden de la imagen
 *           description: Lista de imágenes del producto
 *       example:
 *         id: "550e8400-e29b-41d4-a716-446655440001"
 *         title: "Camiseta Vintage"
 *         description: "Camiseta de algodón de excelente calidad, poco uso"
 *         price: 1500
 *         category_id: "550e8400-e29b-41d4-a716-446655440002"
 *         size_id: "550e8400-e29b-41d4-a716-446655440003"
 *         user_id: "550e8400-e29b-41d4-a716-446655440000"
 *         status: "disponible"
 *         created_at: "2024-03-19T12:00:00Z"
 *         updated_at: "2024-03-19T12:00:00Z"
 *         is_active: true
 *         favorites_count: 0
 *         images: [
 *           {
 *             id: "550e8400-e29b-41d4-a716-446655440004",
 *             image_url: "https://storage.googleapis.com/roperito-4d180.appspot.com/products/image1.jpg",
 *             order: 1
 *           }
 *         ]
 * 
 *     Order:
 *       type: object
 *       required:
 *         - product_id
 *         - seller_id
 *         - buyer_id
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único de la orden
 *         product_id:
 *           type: string
 *           format: uuid
 *           description: ID del producto comprado
 *         seller_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario vendedor
 *         buyer_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario comprador
 *         price:
 *           type: number
 *           format: float
 *           description: Precio final de la compra
 *         status:
 *           type: string
 *           description: Estado actual de la orden
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la orden
 *       example:
 *         id: "550e8400-e29b-41d4-a716-446655440005"
 *         product_id: "550e8400-e29b-41d4-a716-446655440001"
 *         seller_id: "550e8400-e29b-41d4-a716-446655440006"
 *         buyer_id: "550e8400-e29b-41d4-a716-446655440000"
 *         price: 1500.00
 *         status: "pendiente"
 *         created_at: "2024-03-19T12:00:00Z"
 * 
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensaje de error
 *       example:
 *         error: "Error al procesar la solicitud"
 */ 