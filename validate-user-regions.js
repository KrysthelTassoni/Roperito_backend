import pool from './config/db.js';
import metadataController from './controllers/metadata.controller.js';

/**
 * Script principal para validar el manejo de regiones y ciudades
 */
async function validateUserRegionsAndCities() {
  try {
    console.log("====== VALIDACIÓN DE REGIONES Y CIUDADES DE USUARIO ======\n");
    
    // PASO 1: Validar que las regiones definidas en el controlador sean consistentes
    await validateRegionsDefinition();
    
    console.log("\n--------------------------------------------------\n");
    
    // PASO 2: Probar la actualización de un perfil con dirección
    await testUserAddressUpdate();
    
  } catch (error) {
    console.error("Error general en la validación:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

/**
 * Valida que las regiones definidas en el controlador sean consistentes con la base de datos
 */
async function validateRegionsDefinition() {
  try {
    console.log("=== VALIDACIÓN DE DEFINICIÓN DE REGIONES ===");
    
    // 1. Obtener las regiones del controlador
    const mockResponse = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    console.log("Obteniendo regiones desde el controlador...");
    await metadataController.getRegions({}, mockResponse);
    
    if (!mockResponse.data || !mockResponse.data.regions) {
      console.error("Error: El controlador no devolvió datos de regiones");
      return { success: false, regions: [] };
    }
    
    const controllerRegions = mockResponse.data.regions;
    console.log(`Se obtuvieron ${controllerRegions.length} regiones del controlador`);
    
    // 2. Verificar las regiones utilizadas en la base de datos
    console.log("Consultando regiones utilizadas en la base de datos...");
    const dbRegionsResult = await pool.query(`
      SELECT DISTINCT region FROM address WHERE region IS NOT NULL
    `);
    
    const dbRegions = dbRegionsResult.rows.map(r => r.region);
    console.log(`Se encontraron ${dbRegions.length} valores de región distintos en la base de datos`);
    
    if (dbRegions.length > 0) {
      console.log("Regiones en la base de datos:", dbRegions);
    } else {
      console.log("No se encontraron registros de regiones en la base de datos");
    }
    
    // 3. Verificar si todas las regiones de la base de datos están definidas en el controlador
    const controllerRegionValues = controllerRegions.map(r => r.value);
    
    const invalidRegions = dbRegions.filter(
      dbRegion => !controllerRegionValues.includes(dbRegion)
    );
    
    if (invalidRegions.length > 0) {
      console.log("❌ ATENCIÓN: Se encontraron valores de región en la base de datos que no están definidos en el controlador:");
      console.log(invalidRegions);
    } else if (dbRegions.length > 0) {
      console.log("✅ VALIDACIÓN EXITOSA: Todas las regiones en la base de datos son válidas");
    } else {
      console.log("ℹ️ INFORMACIÓN: No hay datos de regiones en la base de datos para validar");
    }
    
    // 4. Imprimir las regiones disponibles para referencia
    console.log("\nRegiones definidas en el controlador:");
    controllerRegions.forEach(region => {
      console.log(`- ${region.value}: "${region.label}"`);
    });
    
    return { success: true, regions: controllerRegions };
    
  } catch (error) {
    console.error("Error en la validación de regiones:", error);
    return { success: false, regions: [] };
  }
}

/**
 * Prueba la actualización de un perfil de usuario con datos de dirección
 */
async function testUserAddressUpdate() {
  try {
    console.log("=== PRUEBA DE ACTUALIZACIÓN DE DIRECCIÓN DE USUARIO ===");
    
    // 1. Obtener un usuario existente para la prueba
    console.log("Buscando un usuario para la prueba...");
    const userResult = await pool.query(`SELECT id, name, email FROM users LIMIT 1`);
    
    if (userResult.rows.length === 0) {
      console.error("No se encontró ningún usuario para realizar la prueba");
      return false;
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
        return false;
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
          return true;
        } else {
          console.log("❌ ERROR: Los datos guardados no coinciden con los datos enviados");
          console.log("Datos esperados:", newAddressData);
          console.log("Datos reales:", updatedAddress);
          return false;
        }
      }
      
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error durante la actualización:", error);
      return false;
    }
    
  } catch (error) {
    console.error("Error en la prueba de actualización:", error);
    return false;
  }
}

// Ejecutar el script principal
validateUserRegionsAndCities(); 