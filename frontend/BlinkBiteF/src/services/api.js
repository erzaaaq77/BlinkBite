import axios from 'axios';

const api = axios.create({
    baseURL: `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "")}/`
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

const refreshToken = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api";
    
    try {
        console.log('🔄 Attempting to refresh token...');
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('access_token');
            return null;
        }

        const data = await res.json();
        
        if (data?.token) {
            sessionStorage.setItem('access_token', data.token);
            return data.token;
        }

        sessionStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
        return null;
    } catch (err) {
        console.error('Token refresh failed:', err?.message ?? err);
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
        return null;
    }
};

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                const newToken = await refreshToken();
                isRefreshing = false;

                if (newToken) {
                    onRefreshed(newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } else {
                    return Promise.reject(error);
                }
            } else {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        } else {
                            reject(error);
                        }
                    });
                });
            }
        }

        return Promise.reject(error);
    }
);

export default api;
