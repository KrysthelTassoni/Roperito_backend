import pool from './config/db.js';

async function checkSizes() {
  try {
    const result = await pool.query('SELECT * FROM sizes');
    console.log('Contenido de la tabla sizes:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkSizes(); 