import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { query } from "../config/db.js";

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      // Verificar si el email ya existe
      const userExists = await query("SELECT id FROM users WHERE email = $1", [
        email,
      ]);

      if (userExists.rows.length > 0) {
        return res.status(409).json({ error: "Email ya registrado" });
      }

      // Generar hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Crear nuevo usuario
      const userId = randomUUID();
      const result = await query(
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

      // Buscar usuario por email
      const result = await query(
        "SELECT id, name, email, password_hash FROM users WHERE email = $1",
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Obtener productos del usuario
      const productsResult = await query(
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
            'is_main', pi.is_main,
            'order', pi."order"
          )
          ORDER BY pi.is_main DESC, pi."order" ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN sizes s ON p.size_id = s.id
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.user_id = $1
    GROUP BY p.id, c.name, s.name
  `,
        [user.id]
      );

      // Obtener productos favoritos del usuario
      const favoritesResult = await query(
        `
          SELECT f.*, p.title, p.price, pi.image_url
          FROM favorites f
          JOIN products p ON f.product_id = p.id
          LEFT JOIN LATERAL (
            SELECT image_url FROM product_images
            WHERE product_id = p.id
            ORDER BY is_main DESC, "order" ASC
            LIMIT 1
          ) pi ON true
          WHERE f.user_id = $1
        `,
        [user.id]
      );

      // Generar token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Devolver respuesta con user, token, products y favorites
      res.json({
        user,
        products: productsResult.rows,
        favorites: favoritesResult.rows,
        token,
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  },
};

export default authController;
