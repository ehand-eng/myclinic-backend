import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token and role header
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userRole = await AsyncStorage.getItem('userRole');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (userRole) {
                config.headers['X-User-Role'] = userRole;
            }
        } catch (error) {
            console.error('Error getting auth data:', error);
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            await AsyncStorage.multiRemove(['authToken', 'userData', 'userRole']);
            // Navigation would be handled by auth context
        }

        return Promise.reject(error);
    }
);

export default apiClient;
