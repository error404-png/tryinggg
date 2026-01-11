import axios from 'axios';

const api = axios.create({
  baseURL: '', // Use relative path to leverage Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

