import pool from './config/db.js';

async function checkCategories() {
  try {
    const result = await pool.query('SELECT * FROM categories');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkCategories(); 