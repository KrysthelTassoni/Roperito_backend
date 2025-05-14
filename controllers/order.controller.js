import pool from "../config/db.js";

const orderController = {
  // Crear una nueva orden
  createOrder: async (req, res) => {
    try {
      const { product_id, shipping_address, payment_method } = req.body;
      const buyer_id = req.user.id;

      await pool.query("BEGIN");

      // Verificar que el producto existe y está disponible
      const productCheck = await pool.query(
        "SELECT user_id, price, status FROM products WHERE id = $1 AND is_active = true",
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const product = productCheck.rows[0];

      // Verificar que el producto está disponible
      if (product.status !== "disponible") {
        return res
          .status(400)
          .json({ error: "El producto no está disponible" });
      }

      // Verificar que el comprador no es el vendedor
      if (product.user_id === buyer_id) {
        return res
          .status(400)
          .json({ error: "No puedes comprar tu propio producto" });
      }

      // Crear la orden
      const orderQuery = `
                INSERT INTO orders (product_id, seller_id, buyer_id, price, status, shipping_address, payment_method)
                VALUES ($1, $2, $3, $4, 'pendiente', $5, $6)
                RETURNING id
            `;
      const orderResult = await pool.query(orderQuery, [
        product_id,
        product.user_id,
        buyer_id,
        product.price,
        shipping_address,
        payment_method,
      ]);

      // Actualizar estado del producto
      await pool.query("UPDATE products SET status = $1 WHERE id = $2", [
        "reservado",
        product_id,
      ]);

      await pool.query("COMMIT");

      res.status(201).json({
        message: "Orden creada exitosamente",
        orderId: orderResult.rows[0].id,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al crear la orden:", error);
      res.status(500).json({ error: "Error al crear la orden" });
    }
  },

  // Obtener una orden específica
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const query = `
               SELECT o.*,
       p.title as product_title,
       p.description as product_description,
       pi.image_url as product_image,
       s.name as seller_name,
       b.name as buyer_name
FROM orders o
JOIN products p ON o.product_id = p.id
LEFT JOIN product_images pi ON p.id = pi.product_id
JOIN users s ON o.seller_id = s.id
JOIN users b ON o.buyer_id = b.id
WHERE o.id = $1 
  AND (o.seller_id = $2 OR o.buyer_id = $2)
ORDER BY pi."order" ASC
LIMIT 1;

            `;
      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al obtener la orden:", error);
      res.status(500).json({ error: "Error al obtener la orden" });
    }
  },

  // Actualizar estado de la orden
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      await pool.query("BEGIN");

      // Verificar que la orden existe y el usuario es el vendedor
      const orderCheck = await pool.query(
        "SELECT seller_id, product_id FROM orders WHERE id = $1",
        [id]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      if (orderCheck.rows[0].seller_id !== userId) {
        return res
          .status(403)
          .json({ error: "No autorizado para modificar esta orden" });
      }

      // Actualizar estado de la orden
      await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);

      // Si la orden se marca como entregada, actualizar el estado del producto
      if (status === "entregada") {
        await pool.query("UPDATE products SET status = $1 WHERE id = $2", [
          "vendido",
          orderCheck.rows[0].product_id,
        ]);
      }

      await pool.query("COMMIT");

      res.json({ message: "Estado de la orden actualizado exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al actualizar estado de la orden:", error);
      res.status(500).json({ error: "Error al actualizar estado de la orden" });
    }
  },

  // Confirmar recepción de la orden
  confirmDelivery: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await pool.query("BEGIN");

      // Verificar que la orden existe y el usuario es el comprador
      const orderCheck = await pool.query(
        "SELECT buyer_id, product_id, status FROM orders WHERE id = $1",
        [id]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      if (orderCheck.rows[0].buyer_id !== userId) {
        return res
          .status(403)
          .json({ error: "No autorizado para confirmar esta entrega" });
      }

      if (orderCheck.rows[0].status !== "enviada") {
        return res
          .status(400)
          .json({
            error:
              "La orden debe estar en estado enviada para confirmar la entrega",
          });
      }

      // Actualizar estado de la orden
      await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
        "entregada",
        id,
      ]);

      // Actualizar estado del producto
      await pool.query("UPDATE products SET status = $1 WHERE id = $2", [
        "vendido",
        orderCheck.rows[0].product_id,
      ]);

      await pool.query("COMMIT");

      res.json({ message: "Entrega confirmada exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al confirmar la entrega:", error);
      res.status(500).json({ error: "Error al confirmar la entrega" });
    }
  },

  // Cancelar una orden
  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      await pool.query("BEGIN");

      // Verificar que la orden existe y el usuario es parte de ella
      const orderCheck = await pool.query(
        "SELECT seller_id, buyer_id, product_id, status FROM orders WHERE id = $1",
        [id]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      const order = orderCheck.rows[0];

      if (order.seller_id !== userId && order.buyer_id !== userId) {
        return res
          .status(403)
          .json({ error: "No autorizado para cancelar esta orden" });
      }

      if (!["pendiente", "confirmada"].includes(order.status)) {
        return res
          .status(400)
          .json({
            error:
              "No se puede cancelar una orden que ya ha sido enviada o entregada",
          });
      }

      // Actualizar estado de la orden
      await pool.query(
        "UPDATE orders SET status = $1, cancellation_reason = $2, cancelled_by = $3 WHERE id = $4",
        ["cancelada", reason, userId, id]
      );

      // Restaurar estado del producto a disponible
      await pool.query("UPDATE products SET status = $1 WHERE id = $2", [
        "disponible",
        order.product_id,
      ]);

      await pool.query("COMMIT");

      res.json({ message: "Orden cancelada exitosamente" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al cancelar la orden:", error);
      res.status(500).json({ error: "Error al cancelar la orden" });
    }
  },
};

export default orderController;
