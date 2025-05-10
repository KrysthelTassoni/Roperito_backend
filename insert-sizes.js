import pool from './config/db.js';
import { v4 as uuidv4 } from 'uuid';

async function insertSizes() {
  try {
    // Insertar tallas
    const sizes = [
      { id: uuidv4(), name: 'XS' },
      { id: uuidv4(), name: 'S' },
      { id: uuidv4(), name: 'M' },
      { id: uuidv4(), name: 'L' },
      { id: uuidv4(), name: 'XL' }
    ];

    // Insertar cada talla
    for (const size of sizes) {
      await pool.query(
        'INSERT INTO sizes (id, name) VALUES ($1, $2)',
        [size.id, size.name]
      );
      console.log(`Talla ${size.name} insertada con ID ${size.id}`);
    }

    console.log('Todos los datos insertados correctamente');
  } catch (error) {
    console.error('Error al insertar datos:', error);
  } finally {
    pool.end();
  }
}

insertSizes(); 