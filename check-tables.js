import pool from './config/db.js';

async function checkTables() {
  try {
    // Consulta para ver todas las tablas en la base de datos
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const result = await pool.query(tableQuery);
    console.log('Tablas en la base de datos:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkTables(); 