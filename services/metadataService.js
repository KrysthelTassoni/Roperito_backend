import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

export const metadataService = {
    getCategories: async() => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.METADATA.CATEGORIES);
        return response.data;
    },

    getSizes: async() => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.METADATA.SIZES);
        return response.data;
    }
};