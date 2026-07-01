import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('renteasy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirige vers /connexion si le token est expiré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('renteasy_token');
      localStorage.removeItem('renteasy_user');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

export default api;
