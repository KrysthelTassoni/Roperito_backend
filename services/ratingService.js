import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const ratingService = {
    create: async(ratingData) => {
        // ratingData debe tener: product_id, value, comment
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.RATINGS.BASE, ratingData);
        return response.data;
    },

    getProductRatings: async(productId) => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.RATINGS.PRODUCT(productId));
        return response.data;
    },

    getUserRatings: async() => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.RATINGS.USER);
        return response.data;
    }
};