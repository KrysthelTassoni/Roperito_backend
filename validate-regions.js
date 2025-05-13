import pool from './config/db.js';
import metadataController from './controllers/metadata.controller.js';

/**
 * Script para validar que las regiones sean coherentes entre el controlador y la base de datos
 */
async function validateRegions() {
  try {
    console.log("=== Validación de regiones ===");
    
    // 1. Obtener las regiones del controlador mediante una simulación de la petición HTTP
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
      return;
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
    } else {
      console.log("✅ VALIDACIÓN EXITOSA: Todas las regiones en la base de datos son válidas");
    }
    
    // 4. Imprimir las regiones disponibles para referencia
    console.log("\nRegiones definidas en el controlador:");
    controllerRegions.forEach(region => {
      console.log(`- ${region.value}: "${region.label}"`);
    });
    
  } catch (error) {
    console.error("Error en la validación:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la validación
validateRegions(); 