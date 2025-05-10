import fetch from 'node-fetch';

const testSizesEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/metadata/sizes');
    const data = await response.json();
    console.log('Respuesta del endpoint de tallas:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al conectar con el endpoint:', error);
  }
};

testSizesEndpoint(); 