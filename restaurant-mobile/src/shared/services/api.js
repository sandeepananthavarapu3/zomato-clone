import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const tokenString = window.localStorage.getItem('restaurant-auth-storage');
      if (tokenString) {
        const auth = JSON.parse(tokenString);
        const token = auth?.state?.tokens?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
  } catch(e) {
    console.error('Error parsing token:', e);
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('restaurant-auth-storage');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
