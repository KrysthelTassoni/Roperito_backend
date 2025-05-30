import { validationResult } from "express-validator";
import pool from "../config/db.js";
import { bucket } from "../firebase.js"; // Asegúrate de que esta ruta esté correcta
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { getIO } from "../socket.js";

const productController = {
  // Obtener todos los productos
  getAllProducts: async (req, res) => {
    try {
      const query = `
      SELECT 
        p.*, 
        json_agg(DISTINCT jsonb_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'order', pi."order"
        )) AS images,
        jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'phone_number', u.phone_number,
          'created_at', u.created_at
        ) AS seller,
        c.name AS category_name,
        s.name AS size_name
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      JOIN sizes s ON p.size_id = s.id
      WHERE p.is_active = true
      GROUP BY p.id, u.id, c.name, s.name
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

      if (!title || !description || !price || !category_id || !size_id) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // Iniciar la transacción
      await pool.query("BEGIN");

      try {
        // Insertar producto
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

        if (!productResult.rows || productResult.rows.length === 0) {
          throw new Error("No se pudo crear el producto");
        }

        const productId = productResult.rows[0].id;

        // Subir imágenes a GCS y guardar en DB
        if (files && files.length > 0) {
          const imageValues = [];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
            const slugify = (str) =>
              str
                .toString()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // quitar acentos
                .replace(/\s+/g, "-") // espacios por guiones
                .replace(/[^\w\-]+/g, "") // eliminar caracteres no válidos
                .replace(/\-\-+/g, "-") // colapsar guiones
                .replace(/^-+|-+$/g, ""); // quitar guiones al inicio y fin

            const shortId = productId.slice(0, 5);
            const folderName = `${slugify(title)}-${shortId}`;
            const blob = bucket.file(`products/${folderName}/${uniqueName}`);

            const blobStream = blob.createWriteStream({
              metadata: {
                contentType: file.mimetype,
              },
            });

            await new Promise((resolve, reject) => {
              blobStream.on("error", reject);
              blobStream.on("finish", resolve);
              blobStream.end(file.buffer);
            });

            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
              bucket.name
            }/o/${encodeURIComponent(
              `products/${folderName}/${uniqueName}`
            )}?alt=media`;

            imageValues.push({
              product_id: productId,
              image_url: publicUrl,
              order: i + 1,
            });
          }

          if (imageValues.length > 0) {
            const imageQuery = `
              INSERT INTO product_images (product_id, image_url, "order")
              VALUES ${imageValues
                .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
                .join(",")}
            `;
            const imageParams = imageValues.flatMap((val) => [
              val.product_id,
              val.image_url,
              val.order,
            ]);
            await pool.query(imageQuery, imageParams);
          }
        }

        // Confirmar transacción
        await pool.query("COMMIT");

        // Obtener el producto completo con sus imágenes
        const finalProduct = await pool.query(
          `SELECT p.*, 
            json_agg(json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'order', pi.order
            )) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          WHERE p.id = $1
          GROUP BY p.id`,
          [productId]
        );

        res.status(201).json({
          message: "Producto creado exitosamente",
          product: finalProduct.rows[0],
        });
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      res.status(500).json({
        error: "Error al crear el producto",
        details: error.message,
      });
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

      // Validar que el producto pertenece al usuario
      const productCheck = await pool.query(
        "SELECT id, title FROM products WHERE id = $1 AND user_id = $2",
        [productId, userId]
      );
      if (productCheck.rowCount === 0) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para modificar este producto" });
      }

      const productTitle = productCheck.rows[0].title;
      const productFolder = `${productTitle}-${productId.slice(0, 5)}`;

      // Imágenes que el usuario quiere mantener (vienen en el body como JSON string)
      const keepImages = req.body.existing_images
        ? JSON.parse(req.body.existing_images).filter((url) =>
            url.startsWith("https://firebasestorage.googleapis.com/")
          )
        : [];

      // Obtener imágenes actuales en la base de datos
      const oldImagesQuery = await pool.query(
        "SELECT image_url FROM product_images WHERE product_id = $1",
        [productId]
      );
      const oldImages = oldImagesQuery.rows.map((row) => row.image_url);

      // Detectar y eliminar imágenes que ya no se deben conservar
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

        // Eliminar referencia de la base de datos
        await pool.query(
          "DELETE FROM product_images WHERE product_id = $1 AND image_url = $2",
          [productId, imageUrl]
        );
      }

      // Subir nuevas imágenes a Firebase y recolectar sus URLs públicas
      const newImages = [];
      for (const file of files) {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        const blob = bucket.file(`products/${productFolder}/${uniqueName}`);
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
        }/o/${encodeURIComponent(
          `products/${productFolder}/${uniqueName}`
        )}?alt=media`;

        newImages.push(publicUrl);
      }

      // Eliminar TODAS las referencias anteriores del producto (sin tocar otros productos)
      await pool.query("DELETE FROM product_images WHERE product_id = $1", [
        productId,
      ]);

      // Insertar imágenes actualizadas con orden nuevo desde 1
      const allImages = [...keepImages, ...newImages];
      for (let i = 0; i < allImages.length; i++) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, "order") VALUES ($1, $2, $3)`,
          [productId, allImages[i], i + 1]
        );
      }

      return res.status(200).json({
        message: "Imágenes actualizadas correctamente",
        urls: allImages,
      });
    } catch (error) {
      console.error("Error al actualizar las imágenes:", error);
      return res.status(500).json({
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

      // Actualizar el estado y retornar el producto base
      const result = await pool.query(
        "UPDATE products SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      const product = result.rows[0];

      // Obtener joins adicionales
      const extraData = await pool.query(
        `
      SELECT 
        c.name AS category_name,
        s.name AS size_name,
        u.name AS seller_name,
        u.email AS seller_email,
        u.created_at AS seller_created_at,
        u.phone_number AS seller_phone_number
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sizes s ON p.size_id = s.id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `,
        [id]
      );

      const joins = extraData.rows[0];

      // Agregar joins al producto
      product.category_name = joins.category_name;
      product.size_name = joins.size_name;
      product.seller = {
        id: product.user_id,
        name: joins.seller_name,
        email: joins.seller_email,
        created_at: joins.seller_created_at,
        phone_number: joins.seller_phone_number,
      };

      // Obtener imágenes (fix: usar "order" con comillas)
      const imageResult = await pool.query(
        `SELECT id, image_url, "order" FROM product_images WHERE product_id = $1 ORDER BY "order" ASC`,
        [id]
      );

      product.images = imageResult.rows;

      // Emitir evento a todos los conectados
      const io = getIO();
      io.emit("cambio_status", product);

      res.json(product);
    } catch (error) {
      console.error("Error al actualizar el estado del producto:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar el estado del producto" });
    }
  },
};

export default productController;
