import fetch from 'node-fetch';

const testStatsEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/metadata/stats');
    const data = await response.json();
    console.log('Respuesta del endpoint de estadísticas:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al conectar con el endpoint:', error);
  }
};

testStatsEndpoint(); 