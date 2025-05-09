import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor para agregar el token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor para manejar errores comunes
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Error de respuesta del servidor
            switch (error.response.status) {
                case 401:
                    // Token expirado o inválido
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    console.error('Acceso denegado');
                    break;
                case 404:
                    console.error('Recurso no encontrado');
                    break;
                default:
                    console.error('Error en la solicitud:', error.response.data);
            }
        } else if (error.request) {
            // Error de red
            console.error('Error de red:', error.request);
        } else {
            // Error en la configuración
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;