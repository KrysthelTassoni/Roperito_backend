import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const productService = {
    create: async(productData) => {
        // productData debe tener: title, description, price, size, category, images (array de objetos: {file, is_main})
        const formData = new FormData();
        formData.append('title', productData.title);
        formData.append('description', productData.description);
        formData.append('price', productData.price);
        formData.append('size', productData.size);
        formData.append('category', productData.category);
        // Adjuntar imágenes
        productData.images.forEach((img, idx) => {
            formData.append(`images[${idx}][file]`, img.file);
            if (img.is_main !== undefined) {
                formData.append(`images[${idx}][is_main]`, img.is_main);
            }
        });
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.PRODUCTS.CREATE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getAll: async(filters = {}) => {
        // filters puede tener: category, size, minPrice, maxPrice, search
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.BASE, { params: filters });
        return response.data;
    },

    getById: async(id) => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.BY_ID(id));
        return response.data;
    },

    update: async(id, updateData) => {
        // updateData puede tener: title, description, price, status
        const response = await apiClient.put(API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE(id), updateData);
        return response.data;
    },

    delete: async(id) => {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.PRODUCTS.DELETE(id));
        return response.data;
    }
};