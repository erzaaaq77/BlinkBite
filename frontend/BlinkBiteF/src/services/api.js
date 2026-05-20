import axios from 'axios';

const api = axios.create({
    baseURL: `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "")}/`
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
