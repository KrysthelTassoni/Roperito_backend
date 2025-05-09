import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const authMiddleware = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario existe en la base de datos
        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            throw new Error();
        }

        // Agregar el usuario a la request
        req.user = result.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Por favor autentícate' });
    }
};

export default authMiddleware; 