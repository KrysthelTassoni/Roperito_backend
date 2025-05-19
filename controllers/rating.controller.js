import pool from "../config/db.js";

const ratingController = {
  // Crear una nueva calificación por orden
  createRating: async (req, res) => {
    const client = await pool.connect();
    try {
      const { order_id, value } = req.body;
      const user_id = req.user.id;

      await client.query("BEGIN");

      // Verifica que la orden existe
      const orderRes = await client.query(
        `SELECT * FROM orders WHERE id = $1`,
        [order_id]
      );

      if (orderRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      const order = orderRes.rows[0];

      // Asegura que el usuario es el comprador
      if (order.buyer_id !== user_id) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({ error: "No autorizado para calificar esta orden" });
      }

      // Asegura que la orden está en estado "vendido"
      if (order.status !== "vendido") {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Solo se pueden calificar órdenes vendidas" });
      }

      // Verifica que no se haya calificado antes esta orden
      const existingRating = await client.query(
        `SELECT 1 FROM ratings WHERE buyer_id = $1 AND order_id = $2`,
        [user_id, order_id]
      );

      if (existingRating.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Ya calificaste esta orden" });
      }

      // Crea la calificación con order_id y seller_id
      const insertRating = await client.query(
        `INSERT INTO ratings (seller_id, buyer_id, value, order_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
        [order.seller_id, user_id, value, order_id]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Calificación registrada con éxito",
        ratingId: insertRating.rows[0].id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error al crear la calificación:", error);
      res.status(500).json({ error: "Error interno al crear la calificación" });
    } finally {
      client.release();
    }
  },

  getRatings: async (req, res) => {
    try {
      const { userId } = req.params;

      const query = `
      SELECT 
        COUNT(*) AS total_ratings,
        ROUND(AVG(value)::numeric, 2) AS average_rating
      FROM ratings
      WHERE seller_id = $1;
    `;

      const result = await pool.query(query, [userId]);

      const { total_ratings, average_rating } = result.rows[0];

      res.json({
        sellerId: userId,
        totalRatings: parseInt(total_ratings),
        averageRating: parseFloat(average_rating) || 0,
      });
    } catch (error) {
      console.error("Error al obtener resumen de valoraciones:", error);
      res
        .status(500)
        .json({ error: "Error al obtener resumen de valoraciones" });
    }
  },

  ifRatingSeller: async (req, res) => {
    try {
      const buyerId = req.user.id;

      const query = `
      SELECT o.id AS order_id, o.seller_id, o.created_at
      FROM orders o
      LEFT JOIN ratings r ON o.id = r.order_id
      WHERE o.buyer_id = $1
        AND o.status = 'vendido'
        AND r.id IS NULL
      ORDER BY o.created_at ASC
      LIMIT 1;
    `;

      const result = await pool.query(query, [buyerId]);

      res.json({
        OrderId: result.rows[0]?.order_id || null,
        sellerId: result.rows[0]?.seller_id || null,
      });
    } catch (error) {
      console.error("Error al verificar si ya fue valorado:", error);
      res.status(500).json({ error: "Error al verificar valoración" });
    }
  },

  // Actualizar una calificación
  updateRating: async (req, res) => {
    try {
      const { id } = req.params;
      const { value } = req.body;
      const user_id = req.user.id;

      await pool.query("BEGIN");

      // Verificar que la calificación existe y pertenece al usuario
      const ratingCheck = await pool.query(
        "SELECT * FROM ratings WHERE id = $1",
        [id]
      );

      if (ratingCheck.rows.length === 0) {
        return res.status(404).json({ error: "Calificación no encontrada" });
      }

      if (ratingCheck.rows[0].buyer_id !== user_id) {
        return res
          .status(403)
          .json({ error: "No autorizado para modificar esta calificación" });
      }

      // Actualizar la calificación
      await pool.query(
        "UPDATE ratings SET value = $1 WHERE id = $2",
        [value, id]
      );

      await pool.query("COMMIT");

      res.json({ message: "Calificación actualizada exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al actualizar la calificación:", error);
      res.status(500).json({ error: "Error al actualizar la calificación" });
    }
  },

  // Eliminar una calificación
  deleteRating: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      await pool.query("BEGIN");

      // Verificar que la calificación existe y pertenece al usuario
      const ratingCheck = await pool.query(
        "SELECT * FROM ratings WHERE id = $1",
        [id]
      );

      if (ratingCheck.rows.length === 0) {
        return res.status(404).json({ error: "Calificación no encontrada" });
      }

      if (ratingCheck.rows[0].buyer_id !== user_id) {
        return res
          .status(403)
          .json({ error: "No autorizado para eliminar esta calificación" });
      }

      // Eliminar la calificación
      await pool.query("DELETE FROM ratings WHERE id = $1", [id]);

      await pool.query("COMMIT");

      res.json({ message: "Calificación eliminada exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al eliminar la calificación:", error);
      res.status(500).json({ error: "Error al eliminar la calificación" });
    }
  },
};

export default ratingController;
