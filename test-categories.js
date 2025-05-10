import fetch from 'node-fetch';

const testCategoriesEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/metadata/categories');
    const data = await response.json();
    console.log('Respuesta del servidor:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al conectar con el endpoint:', error);
  }
};

testCategoriesEndpoint(); 