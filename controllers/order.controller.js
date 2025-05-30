import pool from "../config/db.js";
import { getIO } from "../socket.js";

const orderController = {
  //Registrar mensaje del comprador
  sendMessage: async (req, res) => {
    const userId = req.user.id;

    try {
      const { product_id, message } = req.body;

      if (!product_id) {
        return res.status(400).json({ error: "Falta el product_id" });
      }

      await pool.query("BEGIN");

      // Verificar que el producto existe y está activo
      const productCheck = await pool.query(
        `SELECT id, user_id FROM products WHERE id = $1 AND is_active = true`,
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const product = productCheck.rows[0];

      // Verificar que el usuario no sea el vendedor
      if (product.user_id === userId) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "No puedes enviar mensajes a tu propio producto" });
      }

      // Insertar o actualizar el mensaje
      const result = await pool.query(
        `INSERT INTO potential_buyers (user_id, product_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE
       SET message = EXCLUDED.message, created_at = NOW()
       RETURNING id`,
        [userId, product_id, message]
      );

      // Traer toda la data necesaria para la card (con los campos correctos)
      const enriched = await pool.query(
        `SELECT 
        pb.id,
        pb.user_id AS buyer_id,
        u.name AS buyer_name,
        pb.created_at,
        pb.message,
        pb.responded_at,
        pb.seller_response,
        pb.product_id,
        p.title AS product_title,
        p.user_id AS seller_id,
        su.name AS seller_name
      FROM potential_buyers pb
      JOIN users u ON pb.user_id = u.id
      JOIN products p ON pb.product_id = p.id
      JOIN users su ON p.user_id = su.id
      WHERE pb.id = $1`,
        [result.rows[0].id]
      );

      const fullMessageData = enriched.rows[0];

      await pool.query("COMMIT");

      // Emitir evento al vendedor con data completa
      const io = getIO();
      for (let [socketId, socket] of io.of("/").sockets) {
        if (socket.userId === product.user_id) {
          socket.emit("nuevo_mensaje_comprador", fullMessageData);
        }
      }

      res.status(200).json({
        message: "Mensaje enviado exitosamente",
        data: fullMessageData,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al enviar mensaje:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  getMessages: async (req, res) => {
    const userId = req.user.id;

    try {
      const query = `
      SELECT 
        pb.id,
        pb.message,
        pb.created_at,
        pb.product_id,
        pb.seller_response,
        pb.responded_at,
        u.id AS buyer_id,
        u.name AS buyer_name,
        seller.id AS seller_id,
        seller.name AS seller_name,
        p.title AS product_title
      FROM potential_buyers pb
      JOIN products p ON pb.product_id = p.id
      JOIN users u ON pb.user_id = u.id
      JOIN users seller ON p.user_id = seller.id
      WHERE 
        (
          pb.seller_response IS NOT NULL AND pb.user_id = $1
        ) 
        OR 
        (
          pb.seller_response IS NULL AND p.user_id = $1
        )
      ORDER BY pb.created_at DESC
    `;

      const result = await pool.query(query, [userId]);

      res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      console.error("Error al obtener los mensajes:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  replyMessage: async (req, res) => {
    const sellerId = req.user.id;
    const { potential_buyer_id, seller_response } = req.body;

    if (!potential_buyer_id || !seller_response) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    try {
      await pool.query("BEGIN");

      // 1. Actualizar respuesta del vendedor
      const updateQuery = `
      UPDATE potential_buyers
      SET seller_response = $1, responded_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
      const result = await pool.query(updateQuery, [
        seller_response,
        potential_buyer_id,
      ]);

      const updatedRow = result.rows[0];
      if (!updatedRow) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ message: "Registro no encontrado" });
      }

      // 2. Enriquecer con info del comprador y producto
      const enriched = await pool.query(
        `
      SELECT 
        pb.id,
        pb.user_id AS buyer_id,
        u.name AS buyer_name,
        pb.product_id,
        p.title AS product_title,
        pb.message,
        pb.created_at,
        pb.seller_response,
        pb.responded_at,
        p.user_id AS seller_id,
        seller.name AS seller_name
      FROM potential_buyers pb
      JOIN users u ON pb.user_id = u.id
      JOIN products p ON pb.product_id = p.id
      JOIN users seller ON p.user_id = seller.id
      WHERE pb.id = $1
    `,
        [potential_buyer_id]
      );

      const fullResponse = enriched.rows[0];

      // 3. Emitir socket al comprador
      const io = getIO();
      for (let [socketId, socket] of io.of("/").sockets) {
        if (socket.userId === fullResponse.buyer_id) {
          socket.emit("respuesta_vendedor", fullResponse);
        }
      }

      await pool.query("COMMIT");

      // 4. Devolver data completa al frontend
      res.status(200).json({ success: true, data: fullResponse });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al responder mensaje:", error);
      res.status(500).json({ message: "Error del servidor" });
    }
  },

  checkIfPotentialBuyer: async (req, res) => {
    const userId = req.user.id;

    try {
      const { product_id } = req.query;

      if (!product_id) {
        return res.status(400).json({ error: "Falta el product_id" });
      }

      const result = await pool.query(
        `SELECT 1 FROM potential_buyers WHERE user_id = $1 AND product_id = $2 LIMIT 1`,
        [userId, product_id]
      );

      const exists = result.rows.length > 0;

      res.status(200).json({ exists });
    } catch (error) {
      console.error("Error al verificar potencial comprador:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  getPotentialBuyer: async (req, res) => {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ error: "Falta el ID del producto" });
    }

    try {
      const result = await pool.query(
        `
      SELECT DISTINCT u.id, u.name, u.email
      FROM potential_buyers pb
      JOIN users u ON pb.user_id = u.id
      WHERE pb.product_id = $1
      `,
        [product_id]
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error al obtener posibles compradores:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  createOrder: async (req, res) => {
    const { product_id, buyer_id } = req.body;

    if (!product_id || !buyer_id) {
      return res
        .status(400)
        .json({ error: "Faltan datos requeridos: product_id o buyer_id" });
    }

    try {
      await pool.query("BEGIN");

      // Verificar que el producto existe, está activo y obtener su precio y dueño
      const productResult = await pool.query(
        `SELECT id, user_id AS seller_id, price 
       FROM products 
       WHERE id = $1 AND is_active = true`,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Producto no encontrado o inactivo" });
      }

      const product = productResult.rows[0];
      const sellerId = product.seller_id;
      const price = product.price;

      // Verificar que el comprador haya mostrado interés
      const buyerCheck = await pool.query(
        `SELECT 1 FROM potential_buyers WHERE product_id = $1 AND user_id = $2`,
        [product_id, buyer_id]
      );

      if (buyerCheck.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "El comprador no mostró interés en este producto" });
      }

      // Crear la orden
      const orderResult = await pool.query(
        `INSERT INTO orders (product_id, seller_id, buyer_id, price, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [product_id, sellerId, buyer_id, price, "vendido"]
      );

      const createdOrder = orderResult.rows[0];

      const fullResponseQuery = await pool.query(
        `
  SELECT 
    o.id,
    o.product_id,
    o.buyer_id,
    o.price,
    o.status,
    o.created_at,
    u1.name AS seller_name,
    u2.name AS buyer_name,
    p.title AS product_title,
    p.price AS product_price,
    pi.image_url AS product_image
  FROM orders o
  JOIN users u1 ON o.seller_id = u1.id
  JOIN users u2 ON o.buyer_id = u2.id
  JOIN products p ON o.product_id = p.id
  LEFT JOIN LATERAL (
    SELECT image_url
    FROM product_images
    WHERE product_id = p.id
    ORDER BY "order" ASC
    LIMIT 1
  ) pi ON true
  WHERE o.id = $1
  `,
        [createdOrder.id]
      );

      const fullResponse = fullResponseQuery.rows[0];
      console.log("FULLRESPONSE", fullResponse);
      await pool.query("COMMIT");

      // Emitir socket al comprador
      const io = getIO();
      for (let [socketId, socket] of io.of("/").sockets) {
        if (socket.userId === fullResponse.buyer_id) {
          socket.emit("orden_compraventa", fullResponse);
        }
      }

      return res.status(201).json({
        message: "Orden creada exitosamente",
        data: fullResponse,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al crear orden:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
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

  // Cancelar una orden
  deleteOrderByProduct: async (req, res) => {
    const userId = req.user.id;
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ error: "Falta el ID del producto" });
    }

    try {
      // Buscar la orden que se va a eliminar
      const orderResult = await pool.query(
        `SELECT id, buyer_id, seller_id FROM orders WHERE product_id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
        [product_id, userId]
      );

      if (orderResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Orden no encontrada para ese producto y usuario" });
      }

      const { id: orderId, buyer_id, seller_id } = orderResult.rows[0];

      // Eliminar la orden
      await pool.query(`DELETE FROM orders WHERE id = $1`, [orderId]);

      // Emitir socket al comprador y vendedor
      const io = getIO();
      for (let [socketId, socket] of io.of("/").sockets) {
        if (socket.userId === buyer_id || socket.userId === seller_id) {
          socket.emit("orden_cancelada", { order_id: orderId });
        }
      }

      return res
        .status(200)
        .json({ message: "Orden eliminada exitosamente", order_id: orderId });
    } catch (error) {
      console.error("Error al eliminar orden:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};

export default orderController;
