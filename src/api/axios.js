import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject bearer token and normalize URL prefixes
api.interceptors.request.use(
  (config) => {
    // Resolve path prefix conflict between branch conventions
    if (config.url) {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.substring(4);
      } else if (config.url.startsWith('api/')) {
        config.url = config.url.substring(3);
      }
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
