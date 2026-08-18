/**
 * Instância Axios configurada para o backend CodeLab.
 *
 * - baseURL aponta para o FastAPI em localhost:8000.
 * - Request interceptor: injeta Bearer token do localStorage.
 * - Response interceptor: redireciona para /login em 401.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — injeta token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codelab_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — trata 401
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('codelab_token');
      localStorage.removeItem('codelab_user');
      // Só redireciona se não estiver já na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default httpClient;
