import { validationResult } from "express-validator";
import pool from "../config/db.js";
import { bucket } from "../firebase.js"; // Asegúrate de que esta ruta esté correcta
import { v4 as uuidv4 } from "uuid";
import path from "path";

const productController = {
  // Obtener todos los productos
  getAllProducts: async (req, res) => {
    try {
      const query = `
                SELECT p.*, 
                       array_agg(DISTINCT pi.image_url) as images,
                       u.name as seller_name,
                       c.name as category_name,
                       s.name as size_name
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                JOIN users u ON p.user_id = u.id
                JOIN categories c ON p.category_id = c.id
                JOIN sizes s ON p.size_id = s.id
                WHERE p.is_active = true
                GROUP BY p.id, u.name, c.name, s.name
                ORDER BY p.created_at DESC
            `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ error: "Error al obtener los productos" });
    }
  },

  // Buscar productos
  searchProducts: async (req, res) => {
    try {
      const { query, category, size, minPrice, maxPrice } = req.query;
      let sqlQuery = `
                SELECT p.*, 
                       array_agg(DISTINCT pi.image_url) as images,
                       u.name as seller_name,
                       c.name as category_name,
                       s.name as size_name
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                JOIN users u ON p.user_id = u.id
                JOIN categories c ON p.category_id = c.id
                JOIN sizes s ON p.size_id = s.id
                WHERE p.is_active = true
            `;
      const values = [];
      let paramCount = 1;

      if (query) {
        sqlQuery += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
        values.push(`%${query}%`);
        paramCount++;
      }
      if (category) {
        sqlQuery += ` AND c.id = $${paramCount}`;
        values.push(category);
        paramCount++;
      }
      if (size) {
        sqlQuery += ` AND s.id = $${paramCount}`;
        values.push(size);
        paramCount++;
      }
      if (minPrice) {
        sqlQuery += ` AND p.price >= $${paramCount}`;
        values.push(minPrice);
        paramCount++;
      }
      if (maxPrice) {
        sqlQuery += ` AND p.price <= $${paramCount}`;
        values.push(maxPrice);
        paramCount++;
      }

      sqlQuery += ` GROUP BY p.id, u.name, c.name, s.name ORDER BY p.created_at DESC`;

      const result = await pool.query(sqlQuery, values);
      res.json(result.rows);
    } catch (error) {
      console.error("Error en la búsqueda de productos:", error);
      res.status(500).json({ error: "Error en la búsqueda de productos" });
    }
  },

  // Obtener productos por categoría
  getProductsByCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const query = `
                SELECT p.*, 
                       array_agg(DISTINCT pi.image_url) as images,
                       u.name as seller_name,
                       c.name as category_name,
                       s.name as size_name
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                JOIN users u ON p.user_id = u.id
                JOIN categories c ON p.category_id = c.id
                JOIN sizes s ON p.size_id = s.id
                WHERE p.is_active = true AND p.category_id = $1
                GROUP BY p.id, u.name, c.name, s.name
                ORDER BY p.created_at DESC
            `;
      const result = await pool.query(query, [categoryId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error);
      res.status(500).json({ error: "Error al obtener los productos" });
    }
  },

  // Obtener un producto específico
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
                SELECT p.*, 
                       array_agg(DISTINCT pi.image_url) as images,
                       u.name as seller_name,
                       u.email as seller_email,
                       c.name as category_name,
                       s.name as size_name
                FROM products p
                LEFT JOIN product_images pi ON p.id = pi.product_id
                JOIN users u ON p.user_id = u.id
                JOIN categories c ON p.category_id = c.id
                JOIN sizes s ON p.size_id = s.id
                WHERE p.id = $1 AND p.is_active = true
                GROUP BY p.id, u.name, u.email, c.name, s.name
            `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al obtener el producto:", error);
      res.status(500).json({ error: "Error al obtener el producto" });
    }
  },

  createProduct: async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("IMAGES: ", req.files);
      console.log("VALIDATION ERRORS:", validationResult(req).array());
      const { title, description, price, category_id, size_id, status } =
        req.body;
      const userId = req.user.id;
      const files = req.files;

      // Iniciar la transacción
      await pool.query("BEGIN");

      // Insertar el producto en la base de datos
      const productQuery = `
      INSERT INTO products (user_id, title, description, price, category_id, size_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
      const productResult = await pool.query(productQuery, [
        userId,
        title,
        description,
        price,
        category_id,
        size_id,
        status || "disponible",
      ]);
      const productId = productResult.rows[0].id;

      // Subir las imágenes si existen
      if (files && files.length > 0) {
        const imageValues = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
          const blob = bucket.file(`products/${uniqueName}`);
          const blobStream = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });

          // Subir la imagen a Google Cloud Storage
          await new Promise((resolve, reject) => {
            blobStream.on("error", reject);
            blobStream.on("finish", resolve);
            blobStream.end(file.buffer);
          });

          // Obtener la URL pública de la imagen
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURIComponent(`products/${uniqueName}`)}?alt=media`;

          imageValues.push({
            product_id: productId,
            image_url: publicUrl,
            order: i + 1,
          });
        }

        // Insertar las imágenes en la base de datos
        const imageQuery = `
    INSERT INTO product_images (product_id, image_url, "order")
    VALUES ${imageValues
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(",")}
  `;
        console.log("imageParamas: ", imageValues);
        const imageParams = imageValues.flatMap((val) => [
          val.product_id,
          val.image_url,
          val.order,
        ]);
        await pool.query(imageQuery, imageParams);
      }

      // Confirmar la transacción
      await pool.query("COMMIT");

      // Responder con éxito
      res.status(201).json({
        message: "Producto creado exitosamente",
        productId,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error al crear el producto:", error);
      res.status(500).json({ error: "Error al crear el producto" });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, category_id, size_id, status } =
        req.body;
      const userId = req.user.id;

      // Verificar propiedad del producto
      const ownerCheck = await pool.query(
        "SELECT user_id FROM products WHERE id = $1",
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (ownerCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "No autorizado para modificar este producto" });
      }

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title) {
        updates.push(`title = $${paramCount}`);
        values.push(title);
        paramCount++;
      }
      if (description) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (price) {
        updates.push(`price = $${paramCount}`);
        values.push(price);
        paramCount++;
      }
      if (category_id) {
        updates.push(`category_id = $${paramCount}`);
        values.push(category_id);
        paramCount++;
      }
      if (size_id) {
        updates.push(`size_id = $${paramCount}`);
        values.push(size_id);
        paramCount++;
      }
      if (status) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No hay campos para actualizar" });
      }

      values.push(id); // Agrega el ID del producto al final
      const query = `
      UPDATE products 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *;
    `;

      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      res.status(500).json({ error: "Error al actualizar el producto" });
    }
  },

  updateProductImages: async (req, res) => {
    try {
      const productId = req.params.id;
      const files = req.files;
      const userId = req.user.id;

      // Validación de ownership
      const productCheck = await pool.query(
        "SELECT id FROM products WHERE id = $1 AND user_id = $2",
        [productId, userId]
      );
      if (productCheck.rowCount === 0) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para modificar este producto" });
      }

      const keepImages = req.body.existing_images
        ? JSON.parse(req.body.existing_images)
        : [];

      // Obtener imágenes actuales
      const oldImagesQuery = await pool.query(
        "SELECT image_url FROM product_images WHERE product_id = $1",
        [productId]
      );
      const oldImages = oldImagesQuery.rows.map((row) => row.image_url);

      // Eliminar imágenes que ya no están
      const imagesToDelete = oldImages.filter(
        (url) => !keepImages.includes(url)
      );
      for (const imageUrl of imagesToDelete) {
        const filePath = decodeURIComponent(
          imageUrl.split("/o/")[1].split("?")[0]
        );
        try {
          await bucket.file(filePath).delete();
        } catch (err) {
          console.warn(`No se pudo eliminar ${filePath}:`, err.message);
        }
        await pool.query(
          "DELETE FROM product_images WHERE product_id = $1 AND image_url = $2",
          [productId, imageUrl]
        );
      }

      // Subir nuevas imágenes
      const newImages = [];
      for (const file of files) {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        const blob = bucket.file(`products/${uniqueName}`);
        const blobStream = blob.createWriteStream({
          metadata: { contentType: file.mimetype },
        });

        await new Promise((resolve, reject) => {
          blobStream.on("error", reject);
          blobStream.on("finish", resolve);
          blobStream.end(file.buffer);
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(`products/${uniqueName}`)}?alt=media`;

        newImages.push(publicUrl);
      }

      // Recalcular orden desde 1
      const allImagesOrdered = [...keepImages, ...newImages].map(
        (url, index) => ({
          url,
          order: index + 1,
        })
      );

      // Actualizar el orden de todas las imágenes (tanto las existentes como las nuevas)
      for (const { url, order } of allImagesOrdered) {
        const existsInDB = keepImages.includes(url);
        if (existsInDB) {
          await pool.query(
            `UPDATE product_images SET "order" = $1 WHERE product_id = $2 AND image_url = $3`,
            [order, productId, url]
          );
        } else {
          // Insertar nuevas imágenes con el nuevo orden
          await pool.query(
            `INSERT INTO product_images (product_id, image_url, "order") VALUES ($1, $2, $3)`,
            [productId, url, order]
          );
        }
      }

      res.status(200).json({
        message: "Imágenes actualizadas correctamente",
        urls: allImagesOrdered.map((img) => img.url),
      });
    } catch (error) {
      console.error("Error al actualizar las imágenes:", error);
      res.status(500).json({
        error: "Error al actualizar las imágenes del producto",
      });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verificar propiedad del producto
      const ownerCheck = await pool.query(
        "SELECT user_id FROM products WHERE id = $1",
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (ownerCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "No autorizado para eliminar este producto" });
      }

      // Obtener las imágenes asociadas al producto
      const imageResult = await pool.query(
        "SELECT image_url FROM product_images WHERE product_id = $1",
        [id]
      );

      const imageUrls = imageResult.rows.map((row) => row.image_url);

      // Eliminar los archivos del bucket
      for (const url of imageUrls) {
        const pathMatch = decodeURIComponent(url).match(
          /\/o\/(.*?)\?alt=media/
        );
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1]; // Esto da algo como "products/uuid.jpg"
          await bucket
            .file(filePath)
            .delete()
            .catch((err) => {
              console.warn(
                "Error al borrar archivo de storage:",
                filePath,
                err.message
              );
            });
        }
      }

      // Eliminar entradas de imágenes
      await pool.query("DELETE FROM product_images WHERE product_id = $1", [
        id,
      ]);

      // Eliminar el producto
      await pool.query("DELETE FROM products WHERE id = $1", [id]);

      res.json({ message: "Producto e imágenes eliminados exitosamente" });
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      res.status(500).json({ error: "Error al eliminar el producto" });
    }
  },

  // Actualizar estado del producto
  updateProductStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Verificar propiedad del producto
      const ownerCheck = await pool.query(
        "SELECT user_id FROM products WHERE id = $1",
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (ownerCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "No autorizado para modificar este producto" });
      }

      const result = await pool.query(
        "UPDATE products SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al actualizar el estado del producto:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar el estado del producto" });
    }
  },
};

export default productController;
