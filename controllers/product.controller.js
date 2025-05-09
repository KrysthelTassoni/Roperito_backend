import pool from '../config/db.js';

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
            console.error('Error al obtener productos:', error);
            res.status(500).json({ error: 'Error al obtener los productos' });
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
            console.error('Error en la búsqueda de productos:', error);
            res.status(500).json({ error: 'Error en la búsqueda de productos' });
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
            console.error('Error al obtener productos por categoría:', error);
            res.status(500).json({ error: 'Error al obtener los productos' });
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
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error al obtener el producto:', error);
            res.status(500).json({ error: 'Error al obtener el producto' });
        }
    },

    // Crear un nuevo producto
    createProduct: async (req, res) => {
        try {
            const { title, description, price, category_id, size_id, status } = req.body;
            const userId = req.user.id;
            const files = req.files;

            await pool.query('BEGIN');

            // Insertar producto
            const productQuery = `
                INSERT INTO products (user_id, title, description, price, category_id, size_id, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            const productResult = await pool.query(productQuery, [
                userId, title, description, price, category_id, size_id, status || 'disponible'
            ]);
            const productId = productResult.rows[0].id;

            // Insertar imágenes si existen
            if (files && files.length > 0) {
                const imageValues = files.map((file, index) => ({
                    product_id: productId,
                    image_url: `/uploads/${file.filename}`,
                    is_main: index === 0,
                    order: index + 1
                }));

                const imageQuery = `
                    INSERT INTO product_images (product_id, image_url, is_main, "order")
                    VALUES ${imageValues.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(',')}
                `;
                const imageParams = imageValues.flatMap(val => [val.product_id, val.image_url, val.is_main, val.order]);
                await pool.query(imageQuery, imageParams);
            }

            await pool.query('COMMIT');

            res.status(201).json({ 
                message: 'Producto creado exitosamente',
                productId 
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al crear el producto:', error);
            res.status(500).json({ error: 'Error al crear el producto' });
        }
    },

    // Actualizar un producto
    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, price, category_id, size_id, status } = req.body;
            const userId = req.user.id;

            // Verificar propiedad del producto
            const ownerCheck = await pool.query(
                'SELECT user_id FROM products WHERE id = $1',
                [id]
            );

            if (ownerCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            if (ownerCheck.rows[0].user_id !== userId) {
                return res.status(403).json({ error: 'No autorizado para modificar este producto' });
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

            values.push(id);
            const query = `
                UPDATE products 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            res.status(500).json({ error: 'Error al actualizar el producto' });
        }
    },

    // Actualizar imágenes del producto
    updateProductImages: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const files = req.files;

            // Verificar propiedad del producto
            const ownerCheck = await pool.query(
                'SELECT user_id FROM products WHERE id = $1',
                [id]
            );

            if (ownerCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            if (ownerCheck.rows[0].user_id !== userId) {
                return res.status(403).json({ error: 'No autorizado para modificar este producto' });
            }

            await pool.query('BEGIN');

            // Eliminar imágenes anteriores
            await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);

            // Insertar nuevas imágenes
            if (files && files.length > 0) {
                const imageValues = files.map((file, index) => ({
                    product_id: id,
                    image_url: `/uploads/${file.filename}`,
                    is_main: index === 0,
                    order: index + 1
                }));

                const imageQuery = `
                    INSERT INTO product_images (product_id, image_url, is_main, "order")
                    VALUES ${imageValues.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(',')}
                `;
                const imageParams = imageValues.flatMap(val => [val.product_id, val.image_url, val.is_main, val.order]);
                await pool.query(imageQuery, imageParams);
            }

            await pool.query('COMMIT');

            res.json({ message: 'Imágenes actualizadas exitosamente' });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al actualizar las imágenes:', error);
            res.status(500).json({ error: 'Error al actualizar las imágenes' });
        }
    },

    // Eliminar un producto
    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verificar propiedad del producto
            const ownerCheck = await pool.query(
                'SELECT user_id FROM products WHERE id = $1',
                [id]
            );

            if (ownerCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            if (ownerCheck.rows[0].user_id !== userId) {
                return res.status(403).json({ error: 'No autorizado para eliminar este producto' });
            }

            // Soft delete
            await pool.query(
                'UPDATE products SET is_active = false WHERE id = $1',
                [id]
            );

            res.json({ message: 'Producto eliminado exitosamente' });
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
            res.status(500).json({ error: 'Error al eliminar el producto' });
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
                'SELECT user_id FROM products WHERE id = $1',
                [id]
            );

            if (ownerCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            if (ownerCheck.rows[0].user_id !== userId) {
                return res.status(403).json({ error: 'No autorizado para modificar este producto' });
            }

            const result = await pool.query(
                'UPDATE products SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error al actualizar el estado del producto:', error);
            res.status(500).json({ error: 'Error al actualizar el estado del producto' });
        }
    }
};

export default productController; 