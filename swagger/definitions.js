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
 *           description: Título del producto
 *         description:
 *           type: string
 *           description: Descripción detallada del producto
 *         price:
 *           type: number
 *           format: float
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
 *           enum: [disponible, reservado, vendido]
 *           description: Estado actual del producto
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               image_url:
 *                 type: string
 *                 format: uri
 *               order:
 *                 type: integer
 *           description: Lista de imágenes del producto
 *       example:
 *         id: 550e8400-e29b-41d4-a716-446655440001
 *         title: Camiseta Vintage
 *         description: Camiseta de algodón de excelente calidad, poco uso
 *         price: 1500
 *         category_id: 550e8400-e29b-41d4-a716-446655440002
 *         size_id: 550e8400-e29b-41d4-a716-446655440003
 *         user_id: 550e8400-e29b-41d4-a716-446655440000
 *         status: disponible
 *         images: [
 *           {
 *             id: 550e8400-e29b-41d4-a716-446655440004,
 *             image_url: "https://example.com/images/product1.jpg",
 *             order: 1
 *           }
 *         ]
 * 
 *     Order:
 *       type: object
 *       required:
 *         - product_id
 *         - buyer_id
 *         - seller_id
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
 *         buyer_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario comprador
 *         seller_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario vendedor
 *         price:
 *           type: number
 *           format: float
 *           description: Precio final de la compra
 *         status:
 *           type: string
 *           enum: [pendiente, pagado, enviado, entregado, cancelado]
 *           description: Estado actual de la orden
 *       example:
 *         id: 550e8400-e29b-41d4-a716-446655440005
 *         product_id: 550e8400-e29b-41d4-a716-446655440001
 *         buyer_id: 550e8400-e29b-41d4-a716-446655440000
 *         seller_id: 550e8400-e29b-41d4-a716-446655440006
 *         price: 1500
 *         status: pendiente
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