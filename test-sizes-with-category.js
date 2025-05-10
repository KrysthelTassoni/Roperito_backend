import fetch from 'node-fetch';

const testSizesWithCategoryEndpoint = async () => {
  try {
    // Usamos uno de los IDs de categoría que vimos en la respuesta anterior
    const categoryId = '00000000-0000-0000-0000-000000000001'; // ID de la categoría "Camisetas"
    const response = await fetch(`http://localhost:3002/api/metadata/sizes?category_id=${categoryId}`);
    const data = await response.json();
    console.log(`Respuesta del endpoint de tallas para la categoría ${categoryId}:`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al conectar con el endpoint:', error);
  }
};

testSizesWithCategoryEndpoint(); 