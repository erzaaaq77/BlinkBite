const ACCESS_TOKEN_KEY = "access_token";

export const tokenService = {
    getToken: () => {
        try {
            const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
            if (sessionToken) return sessionToken;

            const legacyToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            if (legacyToken) {
                sessionStorage.setItem(ACCESS_TOKEN_KEY, legacyToken);
                localStorage.removeItem(ACCESS_TOKEN_KEY);
                return legacyToken;
            }
            
            const oldToken = localStorage.getItem('token');
            if (oldToken) return oldToken;
            
        } catch (err) {
            console.error("Token storage read failed", err);
        }
        return "";
    },
    
    setToken: (token) => {
        if (token) {
            sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem('token');
        }
    },
    
    removeToken: () => {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem('token');
    }
};