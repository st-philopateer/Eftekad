import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'حدث خطأ في الاتصال بالخادم';
    console.error(`API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`, message);
    return Promise.reject(new Error(message));
  }
);

export default api;
