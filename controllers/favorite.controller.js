import pool from "../config/db.js";

const favoriteController = {
  // Agregar un producto a favoritos
  addFavorite: async (req, res) => {
    try {
      const { productId } = req.params;

      const user_id = req.user.id;

      await pool.query("BEGIN");

      // Verificar que el producto existe y está activo
      const productCheck = await pool.query(
        "SELECT id, user_id FROM products WHERE id = $1 AND is_active = true",
        [productId]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      // Verificar que el usuario no es el dueño del producto
      if (productCheck.rows[0].user_id === user_id) {
        return res
          .status(400)
          .json({ error: "No puedes agregar tu propio producto a favoritos" });
      }

      // Verificar que el producto no está ya en favoritos
      const favoriteCheck = await pool.query(
        "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
        [user_id, productId]
      );

      if (favoriteCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "El producto ya está en favoritos" });
      }

      // Agregar a favoritos
      await pool.query(
        "INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)",
        [user_id, productId]
      );

      // Incrementar contador de favoritos del producto
      await pool.query(
        "UPDATE products SET favorites_count = favorites_count + 1 WHERE id = $1",
        [productId]
      );

      await pool.query("COMMIT");

      res
        .status(201)
        .json({ message: "Producto agregado a favoritos exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al agregar a favoritos:", error);
      res.status(500).json({ error: "Error al agregar a favoritos" });
    }
  },

  // Obtener favoritos del usuario
  getUserFavorites: async (req, res) => {
    try {
      const user_id = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const query = `
               SELECT 
    f.id as favorite_id,
    f.created_at as favorited_at,
    p.*,
    u.name as seller_name,
    u.rating as seller_rating,
    pi.image_url as main_image
FROM favorites f
JOIN products p ON f.product_id = p.id
JOIN users u ON p.user_id = u.id
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE f.user_id = $1 
    AND p.is_active = true
ORDER BY f.created_at DESC, pi."order" ASC
LIMIT $2 OFFSET $3;

            `;

      const countQuery = `
                SELECT COUNT(*) 
                FROM favorites f
                JOIN products p ON f.product_id = p.id
                WHERE f.user_id = $1 AND p.is_active = true
            `;

      const [favorites, count] = await Promise.all([
        pool.query(query, [user_id, limit, offset]),
        pool.query(countQuery, [user_id]),
      ]);

      const totalPages = Math.ceil(count.rows[0].count / limit);

      res.json({
        favorites: favorites.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: parseInt(count.rows[0].count),
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ error: "Error al obtener favoritos" });
    }
  },

  // Eliminar un producto de favoritos
  removeFavorite: async (req, res) => {
    try {
      const { productId } = req.params;
      const user_id = req.user.id;

      await pool.query("BEGIN");

      // Verificar que el favorito existe
      const favoriteCheck = await pool.query(
        "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
        [user_id, productId]
      );

      if (favoriteCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Producto no encontrado en favoritos" });
      }

      // Eliminar de favoritos
      await pool.query(
        "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
        [user_id, productId]
      );

      // Decrementar contador de favoritos del producto
      await pool.query(
        "UPDATE products SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = $1",
        [productId]
      );

      await pool.query("COMMIT");

      res.json({ message: "Producto eliminado de favoritos exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al eliminar de favoritos:", error);
      res.status(500).json({ error: "Error al eliminar de favoritos" });
    }
  },

  // Verificar si un producto está en favoritos
  checkFavorite: async (req, res) => {
    try {
      const { product_id } = req.params;
      const user_id = req.user.id;

      const result = await pool.query(
        "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
        [user_id, product_id]
      );

      res.json({
        isFavorite: result.rows.length > 0,
      });
    } catch (error) {
      console.error("Error al verificar favorito:", error);
      res.status(500).json({ error: "Error al verificar favorito" });
    }
  },

  // Obtener productos más favoriteados
  getMostFavorited: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const query = `
              SELECT 
    p.*,
    u.name as seller_name,
    u.rating as seller_rating,
    pi.image_url as main_image,
    COUNT(f.id) as favorites_count
FROM products p
JOIN users u ON p.user_id = u.id
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN favorites f ON p.id = f.product_id
WHERE p.is_active = true 
    AND p.status = 'disponible'
GROUP BY p.id, u.id, pi.image_url
ORDER BY favorites_count DESC, p.created_at DESC, pi."order" ASC
LIMIT $1;

            `;

      const result = await pool.query(query, [limit]);

      res.json({
        products: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener productos más favoriteados:", error);
      res
        .status(500)
        .json({ error: "Error al obtener productos más favoriteados" });
    }
  },
};

export default favoriteController;
