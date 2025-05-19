import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import pool from "../config/db.js";

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      // Verificar si el email ya existe
      const userExists = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(409).json({ error: "Email ya registrado" });
      }

      // Generar hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Crear nuevo usuario
      const userId = randomUUID();
      const result = await pool.query(
        "INSERT INTO users (id, name, email, password_hash, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email",
        [userId, name, email, passwordHash, phone]
      );

      const user = result.rows[0];

      // Generar token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        "SELECT id, name, email, phone_number, password_hash FROM users WHERE email = $1",
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Obtener dirección del usuario
      const addressResult = await pool.query(
        `
      SELECT city, region, country, province
      FROM address
      WHERE user_id = $1
    `,
        [user.id]
      );

      const address = addressResult.rows[0] || null;

      // Productos
      const productsResult = await pool.query(
        `
      SELECT 
        p.*, 
        c.name AS category_name, 
        s.name AS size_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pi.id,
              'image_url', pi.image_url,
              'order', pi."order"
            )
            ORDER BY pi."order"
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) AS images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sizes s ON p.size_id = s.id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id, c.name, s.name;
      `,
        [user.id]
      );

      // Favoritos
      const favoritesResult = await pool.query(
        `
      SELECT 
        f.*, 
        p.title, 
        p.price,
        COALESCE(
          (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', pi.id,
                'image_url', pi.image_url,
                'order', pi."order"
              )
              ORDER BY pi."order"
            )
            FROM product_images pi
            WHERE pi.product_id = p.id
          ),
          '[]'::json
        ) AS images
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = $1;
      `,
        [user.id]
      );

      const ordersBoughtResult = await pool.query(
        `
     SELECT 
  o.id,
  o.product_id,
  o.price,
  o.status,
  o.created_at,
  o.seller_id,
  p.title AS product_title,
  p.price AS product_price,
  (
    SELECT pi.image_url
    FROM product_images pi
    WHERE pi.product_id = p.id
    ORDER BY pi."order"
    LIMIT 1
  ) AS product_image,
  u_seller.name AS seller_name,
  u_buyer.name AS buyer_name
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN users u_seller ON o.seller_id = u_seller.id
JOIN users u_buyer ON o.buyer_id = u_buyer.id
WHERE o.buyer_id = $1
ORDER BY o.created_at DESC;


      `,
        [user.id]
      );

      // 💼 Órdenes donde el usuario fue VENDEDOR
      const ordersSoldResult = await pool.query(
        `
    SELECT 
  o.id,
  o.product_id,
  o.price,
  o.status,
  o.created_at,
  p.title AS product_title,
  p.price AS product_price,
  (
    SELECT pi.image_url
    FROM product_images pi
    WHERE pi.product_id = p.id
    ORDER BY pi."order"
    LIMIT 1
  ) AS product_image,
  u_seller.name AS seller_name,
  u_buyer.name AS buyer_name
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN users u_seller ON o.seller_id = u_seller.id
JOIN users u_buyer ON o.buyer_id = u_buyer.id
WHERE o.seller_id = $1
ORDER BY o.created_at DESC;

      `,
        [user.id]
      );

      // Token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        user,
        address,
        products: productsResult.rows,
        favorites: favoritesResult.rows,
        orders_bought: ordersBoughtResult.rows,
        orders_sold: ordersSoldResult.rows,
        token,
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  },
};

export default authController;
