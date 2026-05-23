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
        console.log('🔄 Attempting to refresh token from:', `${API_BASE}/auth/refresh`);
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        console.log('📡 Refresh response status:', res.status);
        
        if (!res.ok) {
            console.error('❌ Refresh failed with status:', res.status);
            const errorData = await res.text();
            console.error('📋 Refresh error:', errorData);
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('access_token');
            return null;
        }

        const data = await res.json();
        console.log('✨ New token received from refresh');
        
        if (data?.token) {
            sessionStorage.setItem('access_token', data.token);
            console.log('💾 New token stored in sessionStorage');
            return data.token;
        }

        console.error('❌ Refresh response missing token field');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
        return null;
    } catch (err) {
        console.error('❌ Token refresh fetch error:', err);
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
            console.log('✅ Token attached to request:', config.url);
            console.log('🔑 Authorization header:', config.headers.Authorization);
            
            // Decode token to check expiration
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    const expTime = payload.exp * 1000;
                    const now = Date.now();
                    const timeUntilExpiry = expTime - now;
                    console.log(`⏰ Token expires in ${Math.round(timeUntilExpiry / 1000)}s (${new Date(expTime).toISOString()})`);
                    if (timeUntilExpiry < 0) {
                        console.warn('⚠️ Token is EXPIRED - refresh needed');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Could not decode token:', e.message);
            }
        } else {
            console.warn('⚠️ No token found for request:', config.url);
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
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
            console.warn('⚠️ 401 received on:', originalRequest.url);
            console.error('📋 Error details:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
            console.warn('⚠️ Attempting token refresh...');

            if (!isRefreshing) {
                isRefreshing = true;
                const newToken = await refreshToken();
                isRefreshing = false;

                if (newToken) {
                    console.log('✨ Token refresh successful - retrying request');
                    onRefreshed(newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } else {
                    console.error('❌ Token refresh failed - unable to retry');
                    return Promise.reject(error);
                }
            } else {
                // Wait for token refresh to complete, then retry
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
