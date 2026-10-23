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
      const tokenString = window.localStorage.getItem('delivery-auth-storage');
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
