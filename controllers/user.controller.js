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
      SELECT city, region, country
      FROM address
      WHERE user_id = $1
    `,
        [userId]
      );
      
      if (addressResult.rowCount > 0) {
        user.address = addressResult.rows[0];
      } else {
        user.address = { city: "", region: "", country: "Chile" };
      }

      // Obtener productos del usuario
      const productsResult = await pool.query(
        `
      SELECT p.*, c.name AS category_name, s.name AS size_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sizes s ON p.size_id = s.id
      WHERE p.user_id = $1
    `,
        [userId]
      );

      // Obtener productos favoritos del usuario
      const favoritesResult = await pool.query(
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
        [userId]
      );

      res.json({
        user,
        products: productsResult.rows,
        favorites: favoritesResult.rows,
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
      
      console.log("Datos recibidos para actualización:", { 
        userId, 
        userData: { name, phone_number }, 
        addressData: address 
      });

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
        console.log("Query de actualización de usuario:", userQuery);
        console.log("Valores para la query:", values);
        
        await pool.query(userQuery, values);
      }

      // Verificar si el usuario ya tiene una dirección
      if (address) {
        // Primero verificamos si ya existe una dirección para este usuario
        const checkAddressQuery = `SELECT id FROM address WHERE user_id = $1`;
        const addressExists = await pool.query(checkAddressQuery, [userId]);
        
        console.log("¿Existe dirección?", addressExists.rowCount > 0);

        if (addressExists.rowCount > 0) {
          // Actualizar dirección existente
          const updateAddressQuery = `
            UPDATE address 
            SET city = $1, region = $2, country = $3 
            WHERE user_id = $4
          `;
          console.log("Actualizando dirección existente con:", 
            [address.city, address.region, address.country, userId]);
          
          await pool.query(updateAddressQuery, [
            address.city, 
            address.region, 
            address.country, 
            userId
          ]);
        } else {
          // Crear nueva dirección
          const insertAddressQuery = `
            INSERT INTO address (id, user_id, city, region, country) 
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
          `;
          console.log("Creando nueva dirección con:", 
            [userId, address.city, address.region, address.country]);
          
          await pool.query(insertAddressQuery, [
            userId, 
            address.city, 
            address.region, 
            address.country
          ]);
        }
      }

      await pool.query("COMMIT");

      res.json({ message: "Perfil actualizado exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ error: "Error al actualizar el perfil", details: error.message });
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
                LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
                WHERE o.buyer_id = $1
                ORDER BY o.created_at DESC
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
                LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
                WHERE o.seller_id = $1
                ORDER BY o.created_at DESC
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
