import pool from '../config/db.js';

const userController = {
    // Obtener perfil del usuario actual
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const query = `
                SELECT u.id, u.name, u.email, u.phone_number, u.created_at,
                       a.city, a.region, a.country
                FROM users u
                LEFT JOIN address a ON u.id = a.user_id
                WHERE u.id = $1
            `;
            const result = await pool.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({ error: 'Error al obtener el perfil' });
        }
    },

    // Actualizar perfil del usuario
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const { name, phone_number, address } = req.body;
            
            await pool.query('BEGIN');

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
                    SET ${updates.join(', ')}
                    WHERE id = $${paramCount}
                `;
                await pool.query(userQuery, values);
            }

            // Actualizar o insertar dirección
            if (address) {
                const addressQuery = `
                    INSERT INTO address (user_id, city, region, country)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET 
                        city = EXCLUDED.city,
                        region = EXCLUDED.region,
                        country = EXCLUDED.country
                `;
                await pool.query(addressQuery, [
                    userId,
                    address.city,
                    address.region,
                    address.country
                ]);
            }

            await pool.query('COMMIT');

            res.json({ message: 'Perfil actualizado exitosamente' });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al actualizar perfil:', error);
            res.status(500).json({ error: 'Error al actualizar el perfil' });
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
            console.error('Error al obtener productos:', error);
            res.status(500).json({ error: 'Error al obtener los productos' });
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
            console.error('Error al obtener favoritos:', error);
            res.status(500).json({ error: 'Error al obtener los favoritos' });
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
            console.error('Error al obtener órdenes de compra:', error);
            res.status(500).json({ error: 'Error al obtener las órdenes de compra' });
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
            console.error('Error al obtener órdenes de venta:', error);
            res.status(500).json({ error: 'Error al obtener las órdenes de venta' });
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
            console.error('Error al obtener calificaciones recibidas:', error);
            res.status(500).json({ error: 'Error al obtener las calificaciones' });
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
            console.error('Error al obtener calificaciones dadas:', error);
            res.status(500).json({ error: 'Error al obtener las calificaciones' });
        }
    }
};

export default userController; 