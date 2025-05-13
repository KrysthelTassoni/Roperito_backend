import pool from './config/db.js';

/**
 * Script para verificar que los datos de región y ciudad se actualicen correctamente en la base de datos
 */
async function testUserAddressData() {
  try {
    console.log("=== Iniciando prueba de datos de región y ciudad del usuario ===");
    
    // 1. Obtener un usuario existente para la prueba (el primero que encontremos)
    console.log("Buscando un usuario para la prueba...");
    const userResult = await pool.query(`SELECT id, name, email FROM users LIMIT 1`);
    
    if (userResult.rows.length === 0) {
      console.error("No se encontró ningún usuario para realizar la prueba");
      return;
    }
    
    const testUser = userResult.rows[0];
    console.log(`Usuario seleccionado para la prueba: ${testUser.name} (${testUser.email})`);
    
    // 2. Verificar si ya tiene una dirección
    console.log("Verificando si el usuario ya tiene una dirección...");
    const addressResult = await pool.query(
      `SELECT * FROM address WHERE user_id = $1`,
      [testUser.id]
    );
    
    const hasAddress = addressResult.rows.length > 0;
    console.log(`¿Usuario tiene dirección?: ${hasAddress}`);
    if (hasAddress) {
      console.log("Datos actuales:", addressResult.rows[0]);
    }
    
    // 3. Simular actualización de perfil con datos de dirección
    const newAddressData = {
      city: "Ciudad de prueba",
      region: "tarapaca", // Valor que corresponde a una de las regiones válidas
      country: "Chile"
    };
    
    console.log(`Actualizando dirección del usuario con: `, newAddressData);
    
    await pool.query("BEGIN");
    
    try {
      if (hasAddress) {
        // Actualizar dirección existente
        await pool.query(
          `UPDATE address SET city = $1, region = $2, country = $3 WHERE user_id = $4`,
          [newAddressData.city, newAddressData.region, newAddressData.country, testUser.id]
        );
        console.log("Dirección actualizada correctamente");
      } else {
        // Crear nueva dirección
        await pool.query(
          `INSERT INTO address (id, user_id, city, region, country) 
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [testUser.id, newAddressData.city, newAddressData.region, newAddressData.country]
        );
        console.log("Nueva dirección creada correctamente");
      }
      
      await pool.query("COMMIT");
      
      // 4. Verificar que los datos se han guardado correctamente
      console.log("Verificando datos actualizados...");
      const updatedAddressResult = await pool.query(
        `SELECT * FROM address WHERE user_id = $1`,
        [testUser.id]
      );
      
      if (updatedAddressResult.rows.length === 0) {
        console.error("ERROR: No se encontró la dirección después de la actualización");
      } else {
        const updatedAddress = updatedAddressResult.rows[0];
        console.log("Datos guardados en la base de datos:", updatedAddress);
        
        // Verificar que los datos guardados son correctos
        const isCorrect = 
          updatedAddress.city === newAddressData.city &&
          updatedAddress.region === newAddressData.region &&
          updatedAddress.country === newAddressData.country;
        
        if (isCorrect) {
          console.log("✅ VALIDACIÓN EXITOSA: Los datos de región y ciudad se guardaron correctamente");
        } else {
          console.log("❌ ERROR: Los datos guardados no coinciden con los datos enviados");
          console.log("Datos esperados:", newAddressData);
          console.log("Datos reales:", updatedAddress);
        }
      }
      
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error durante la actualización:", error);
    }
    
  } catch (error) {
    console.error("Error general:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la prueba
testUserAddressData(); 