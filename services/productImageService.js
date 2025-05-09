import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const productImageService = {
    // Obtener imágenes de un producto
    getProductImages: async (productId) => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.IMAGES(productId));
        return response.data;
    },

    // Subir nueva imagen
    uploadImage: async (productId, { file, is_main, order }) => {
        const formData = new FormData();
        formData.append('image', file);
        if (is_main !== undefined) formData.append('is_main', is_main);
        if (order !== undefined) formData.append('order', order);
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.PRODUCTS.IMAGES(productId),
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    },

    // Establecer imagen principal
    setMainImage: async (productId, imageId) => {
        const response = await apiClient.patch(
            API_CONFIG.ENDPOINTS.PRODUCTS.IMAGE_SET_MAIN(productId, imageId)
        );
        return response.data;
    },

    // Reordenar imágenes
    reorderImages: async (productId, imagesOrder) => {
        // imagesOrder: [{ imageId, newOrder }]
        const response = await apiClient.patch(
            API_CONFIG.ENDPOINTS.PRODUCTS.IMAGE_REORDER(productId),
            { imagesOrder }
        );
        return response.data;
    },

    // Eliminar imagen
    deleteImage: async (productId, imageId) => {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.PRODUCTS.IMAGE_DELETE(productId, imageId)
        );
        return response.data;
    }
}; 