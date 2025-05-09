import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const orderService = {
    // Obtener todas las órdenes del usuario
    getOrders: async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ORDERS.USER_ORDERS);
        return response.data;
    },

    // Obtener una orden específica por ID
    getOrderById: async (id) => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ORDERS.BY_ID(id));
        return response.data;
    },

    // Crear una nueva orden
    createOrder: async (orderData) => {
        // orderData debe tener: product_id, seller_id, price, contact_method
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.ORDERS.BASE, orderData);
        return response.data;
    },

    // Actualizar el estado de una orden
    updateOrderStatus: async (id, status) => {
        // status: { status: 'completed' | 'cancelled' | 'pending' }
        const response = await apiClient.patch(API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status });
        return response.data;
    },

    // Cancelar una orden
    cancelOrder: async (id) => {
        const response = await apiClient.patch(API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS(id), { 
            status: API_CONFIG.ORDER_STATUS.CANCELLED 
        });
        return response.data;
    },

    // Verificar si un producto tiene orden
    checkProductOrder: async (productId) => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ORDERS.CHECK_PRODUCT(productId));
        return response.data;
    },

    // Obtener orden por ID de producto
    getOrderByProductId: async (productId) => {
        const response = await apiClient.get(`/api/orders/product/${productId}`);
        return response.data;
    }
}; 