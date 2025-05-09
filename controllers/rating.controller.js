import pool from '../config/db.js';

const ratingController = {
    // Crear una nueva calificación
    createRating: async (req, res) => {
        try {
            const { order_id, rating, comment } = req.body;
            const user_id = req.user.id;

            await pool.query('BEGIN');

            // Verificar que la orden existe y está entregada
            const orderCheck = await pool.query(
                'SELECT o.*, p.user_id as seller_id FROM "order" o JOIN products p ON o.product_id = p.id WHERE o.id = $1',
                [order_id]
            );

            if (orderCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Orden no encontrada' });
            }

            const order = orderCheck.rows[0];

            // Verificar que el usuario es el comprador
            if (order.buyer_id !== user_id) {
                return res.status(403).json({ error: 'No autorizado para calificar esta orden' });
            }

            // Verificar que la orden está entregada
            if (order.status !== 'entregada') {
                return res.status(400).json({ error: 'Solo se pueden calificar órdenes entregadas' });
            }

            // Verificar que no existe una calificación previa
            const ratingCheck = await pool.query(
                'SELECT id FROM ratings WHERE order_id = $1',
                [order_id]
            );

            if (ratingCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Esta orden ya ha sido calificada' });
            }

            // Crear la calificación
            const ratingQuery = `
                INSERT INTO ratings (order_id, product_id, buyer_id, seller_id, rating, comment)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;
            const ratingResult = await pool.query(ratingQuery, [
                order_id,
                order.product_id,
                user_id,
                order.seller_id,
                rating,
                comment
            ]);

            // Actualizar el promedio de calificaciones del vendedor
            await pool.query(`
                UPDATE users 
                SET rating = (
                    SELECT AVG(rating)::numeric(2,1)
                    FROM ratings
                    WHERE seller_id = $1
                )
                WHERE id = $1
            `, [order.seller_id]);

            await pool.query('COMMIT');

            res.status(201).json({
                message: 'Calificación creada exitosamente',
                ratingId: ratingResult.rows[0].id
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al crear la calificación:', error);
            res.status(500).json({ error: 'Error al crear la calificación' });
        }
    },

    // Obtener calificaciones de un usuario
    getUserRatings: async (req, res) => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const query = `
                SELECT r.*, 
                       p.title as product_title,
                       u.name as buyer_name,
                       pi.image_url as product_image
                FROM ratings r
                JOIN products p ON r.product_id = p.id
                JOIN users u ON r.buyer_id = u.id
                LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
                WHERE r.seller_id = $1
                ORDER BY r.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const countQuery = 'SELECT COUNT(*) FROM ratings WHERE seller_id = $1';

            const [ratings, count] = await Promise.all([
                pool.query(query, [userId, limit, offset]),
                pool.query(countQuery, [userId])
            ]);

            const totalPages = Math.ceil(count.rows[0].count / limit);

            res.json({
                ratings: ratings.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: parseInt(count.rows[0].count),
                    hasMore: page < totalPages
                }
            });
        } catch (error) {
            console.error('Error al obtener las calificaciones:', error);
            res.status(500).json({ error: 'Error al obtener las calificaciones' });
        }
    },

    // Obtener calificaciones de un producto
    getProductRatings: async (req, res) => {
        try {
            const { productId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const query = `
                SELECT r.*,
                       u.name as buyer_name,
                       u.profile_image as buyer_image
                FROM ratings r
                JOIN users u ON r.buyer_id = u.id
                WHERE r.product_id = $1
                ORDER BY r.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const countQuery = 'SELECT COUNT(*) FROM ratings WHERE product_id = $1';

            const [ratings, count] = await Promise.all([
                pool.query(query, [productId, limit, offset]),
                pool.query(countQuery, [productId])
            ]);

            const totalPages = Math.ceil(count.rows[0].count / limit);

            res.json({
                ratings: ratings.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: parseInt(count.rows[0].count),
                    hasMore: page < totalPages
                }
            });
        } catch (error) {
            console.error('Error al obtener las calificaciones del producto:', error);
            res.status(500).json({ error: 'Error al obtener las calificaciones del producto' });
        }
    },

    // Actualizar una calificación
    updateRating: async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            const user_id = req.user.id;

            await pool.query('BEGIN');

            // Verificar que la calificación existe y pertenece al usuario
            const ratingCheck = await pool.query(
                'SELECT * FROM ratings WHERE id = $1',
                [id]
            );

            if (ratingCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Calificación no encontrada' });
            }

            if (ratingCheck.rows[0].buyer_id !== user_id) {
                return res.status(403).json({ error: 'No autorizado para modificar esta calificación' });
            }

            // Actualizar la calificación
            await pool.query(
                'UPDATE ratings SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [rating, comment, id]
            );

            // Actualizar el promedio de calificaciones del vendedor
            await pool.query(`
                UPDATE users 
                SET rating = (
                    SELECT AVG(rating)::numeric(2,1)
                    FROM ratings
                    WHERE seller_id = $1
                )
                WHERE id = $1
            `, [ratingCheck.rows[0].seller_id]);

            await pool.query('COMMIT');

            res.json({ message: 'Calificación actualizada exitosamente' });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al actualizar la calificación:', error);
            res.status(500).json({ error: 'Error al actualizar la calificación' });
        }
    },

    // Eliminar una calificación
    deleteRating: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            await pool.query('BEGIN');

            // Verificar que la calificación existe y pertenece al usuario
            const ratingCheck = await pool.query(
                'SELECT * FROM ratings WHERE id = $1',
                [id]
            );

            if (ratingCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Calificación no encontrada' });
            }

            if (ratingCheck.rows[0].buyer_id !== user_id) {
                return res.status(403).json({ error: 'No autorizado para eliminar esta calificación' });
            }

            // Eliminar la calificación
            await pool.query('DELETE FROM ratings WHERE id = $1', [id]);

            // Actualizar el promedio de calificaciones del vendedor
            await pool.query(`
                UPDATE users 
                SET rating = (
                    SELECT COALESCE(AVG(rating)::numeric(2,1), 0)
                    FROM ratings
                    WHERE seller_id = $1
                )
                WHERE id = $1
            `, [ratingCheck.rows[0].seller_id]);

            await pool.query('COMMIT');

            res.json({ message: 'Calificación eliminada exitosamente' });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al eliminar la calificación:', error);
            res.status(500).json({ error: 'Error al eliminar la calificación' });
        }
    },

    // Reportar una calificación
    reportRating: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user_id = req.user.id;

            await pool.query('BEGIN');

            // Verificar que la calificación existe
            const ratingCheck = await pool.query(
                'SELECT id FROM ratings WHERE id = $1',
                [id]
            );

            if (ratingCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Calificación no encontrada' });
            }

            // Verificar si ya existe un reporte del mismo usuario
            const reportCheck = await pool.query(
                'SELECT id FROM rating_reports WHERE rating_id = $1 AND reported_by = $2',
                [id, user_id]
            );

            if (reportCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Ya has reportado esta calificación' });
            }

            // Crear el reporte
            await pool.query(
                'INSERT INTO rating_reports (rating_id, reported_by, reason) VALUES ($1, $2, $3)',
                [id, user_id, reason]
            );

            // Actualizar contador de reportes en la calificación
            await pool.query(
                'UPDATE ratings SET report_count = report_count + 1 WHERE id = $1',
                [id]
            );

            await pool.query('COMMIT');

            res.status(201).json({ message: 'Calificación reportada exitosamente' });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al reportar calificación:', error);
            res.status(500).json({ error: 'Error al reportar calificación' });
        }
    }
};

export default ratingController; 