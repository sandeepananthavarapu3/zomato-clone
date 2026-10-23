import axios from 'axios';
import { storage } from './storage';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

api.interceptors.request.use((config) => {
  try {
    const tokenString = storage.getString('auth-storage');
    if (tokenString) {
      const auth = JSON.parse(tokenString);
      // Zustand persist wraps state inside { state: ... }
      const token = auth?.state?.tokens?.accessToken || auth?.tokens?.accessToken || auth?.state?.tokens?.access;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch(e) {
    console.error('Error parsing token:', e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokenString = storage.getString('auth-storage');
        if (tokenString) {
          const auth = JSON.parse(tokenString);
          const refreshToken = auth?.state?.tokens?.refreshToken || auth?.tokens?.refreshToken || auth?.state?.tokens?.refresh;
          
          if (refreshToken) {
            // Attempt to refresh
            const res = await axios.post('http://localhost:5000/api/v1/auth/refresh', { refreshToken });
            if (res.data?.data?.tokens) {
              // Update storage with new tokens
              const newTokens = res.data.data.tokens;
              auth.state.tokens = newTokens;
              storage.set('auth-storage', JSON.stringify(auth));
              
              // Update request header and retry
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.warn('Session expired, redirecting to login...');
        // Force logout on failure
        const { useAuthStore } = require('../../features/auth/store/useAuthStore');
        useAuthStore.getState().logout();
      }
      
      // If we reach here, we couldn't refresh, force logout
      const { useAuthStore } = require('../../features/auth/store/useAuthStore');
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);
