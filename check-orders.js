import pool from './config/db.js';

async function checkOrders() {
  try {
    const result = await pool.query('SELECT * FROM orders LIMIT 10');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkOrders(); 