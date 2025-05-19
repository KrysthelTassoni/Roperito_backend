import pool from "../config/db.js";

const userController = {
  // Obtener perfil del usuario actual

  getProfile: async (req, res) => {
    const userId = req.user.id;

    try {
      // Obtener datos del usuario
      const userResult = await pool.query(
        `
      SELECT id, name, email, phone_number, created_at
      FROM users
      WHERE id = $1
    `,
        [userId]
      );

      if (userResult.rowCount === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const user = userResult.rows[0];

      // Obtener dirección del usuario
      const addressResult = await pool.query(
        `
      SELECT city, region, country, province
      FROM address
      WHERE user_id = $1
    `,
        [userId]
      );

      const address = addressResult.rows[0] || null;

      // Obtener productos del usuario con imágenes
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

      // Obtener productos favoritos con array de imágenes
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
        [userId]
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
        [userId]
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
        [userId]
      );

      res.json({
        user,
        address,
        products: productsResult.rows,
        favorites: favoritesResult.rows,
        orders_bought: ordersBoughtResult.rows,
        orders_sold: ordersSoldResult.rows,
      });
    } catch (error) {
      console.error("Error obteniendo datos de usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  // Actualizar perfil del usuario
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, phone_number, address } = req.body;

      await pool.query("BEGIN");

      // Actualizar información básica del usuario
      if (name || phone_number) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name) {
          updates.push(`name = $${paramCount}`);
          values.push(name);
          paramCount++;
        }
        if (phone_number) {
          updates.push(`phone_number = $${paramCount}`);
          values.push(phone_number);
          paramCount++;
        }

        values.push(userId);
        const userQuery = `
                    UPDATE users 
                    SET ${updates.join(", ")}
                    WHERE id = $${paramCount}
                `;
        await pool.query(userQuery, values);
      }

      // Actualizar o insertar dirección
      if (address) {
        const addressQuery = `
                    INSERT INTO address (user_id, city, region, country, province)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET 
                        city = EXCLUDED.city,
                        region = EXCLUDED.region,
                        country = EXCLUDED.country,
                        province = EXCLUDED.province
                `;
        await pool.query(addressQuery, [
          userId,
          address.city,
          address.region,
          address.country,
          address.province,
        ]);
      }

      await pool.query("COMMIT");

      res.json({ message: "Perfil actualizado exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ error: "Error al actualizar el perfil" });
    }
  },

  // Obtener productos del usuario
  getUserProducts: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
                SELECT p.*, 
                       array_agg(pi.image_url) as images
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                WHERE p.user_id = $1
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ error: "Error al obtener los productos" });
    }
  },

  // Obtener favoritos del usuario
  getUserFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
                SELECT p.*, 
                       array_agg(pi.image_url) as images,
                       f.created_at as favorited_at
                FROM favorites f
                JOIN products p ON f.product_id = p.id
                LEFT JOIN product_images pi ON p.id = pi.product_id
                WHERE f.user_id = $1
                GROUP BY p.id, f.created_at
                ORDER BY f.created_at DESC
            `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ error: "Error al obtener los favoritos" });
    }
  },

  // Obtener órdenes de compra del usuario
  getBuyingOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
               SELECT o.*, p.title, p.description, pi.image_url as main_image
FROM orders o
JOIN products p ON o.product_id = p.id
LEFT JOIN product_images pi ON p.id = pi.product_id
ORDER BY pi."order" ASC
WHERE o.buyer_id = $1
ORDER BY o.created_at DESC;

            `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener órdenes de compra:", error);
      res.status(500).json({ error: "Error al obtener las órdenes de compra" });
    }
  },

  // Obtener órdenes de venta del usuario
  getSellingOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
               SELECT o.*, p.title, p.description, pi.image_url as main_image
FROM orders o
JOIN products p ON o.product_id = p.id
LEFT JOIN product_images pi ON p.id = pi.product_id
ORDER BY pi."order" ASC
WHERE o.seller_id = $1
ORDER BY o.created_at DESC;

            `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener órdenes de venta:", error);
      res.status(500).json({ error: "Error al obtener las órdenes de venta" });
    }
  },

  // Obtener calificaciones recibidas
  getReceivedRatings: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
                SELECT r.*, u.name as buyer_name
                FROM ratings r
                JOIN users u ON r.buyer_id = u.id
                WHERE r.seller_id = $1
                ORDER BY r.created_at DESC
            `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener calificaciones recibidas:", error);
      res.status(500).json({ error: "Error al obtener las calificaciones" });
    }
  },

  // Obtener calificaciones dadas
  getGivenRatings: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
                SELECT r.*, u.name as seller_name
                FROM ratings r
                JOIN users u ON r.seller_id = u.id
                WHERE r.buyer_id = $1
                ORDER BY r.created_at DESC
            `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener calificaciones dadas:", error);
      res.status(500).json({ error: "Error al obtener las calificaciones" });
    }
  },
};

export default userController;
