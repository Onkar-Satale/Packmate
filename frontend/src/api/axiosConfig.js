import axios from 'axios';

let inMemoryToken = null;

export const setAccessToken = (token) => {
    inMemoryToken = token;
};

// Centralized logout logic that AuthContext can listen to or directly trigger
export const onLogout = () => {
    inMemoryToken = null;
    window.dispatchEvent(new Event('auth:logout'));
};

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL, 
    withCredentials: true // Extremely important for strictly passing HttpOnly Refresh Cookies
});

export const aiApi = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL + '/ai', 
    withCredentials: true // 5. Ensure aiApi also has withCredentials: true enabled.
});

// Shared interceptors
const requestInterceptor = (config) => {
    if (inMemoryToken) {
        config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
};
const requestErrorInterceptor = (error) => Promise.reject(error);

api.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
aiApi.interceptors.request.use(requestInterceptor, requestErrorInterceptor);

// Concurrency handling for refresh flow
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const responseInterceptor = (response) => response;
const responseErrorInterceptor = async (error) => {
    const originalRequest = error.config;
    
    // 8. Maintain current refresh flow (401 → refresh-token → retry request)
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/refresh-token' && originalRequest.url !== '/login') {
        
        if (isRefreshing) {
            return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axios(originalRequest);
            }).catch(err => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // 2. Do NOT store access token after refresh-token API call (in localStorage)
            const res = await axios.post(`${api.defaults.baseURL}/refresh-token`, {}, { withCredentials: true });
            
            if (res.data?.success && res.data.data?.token) {
                const newToken = res.data.data.token;
                
                // 3. Keep access token only in memory
                setAccessToken(newToken);
                
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);
                
                return axios(originalRequest);
            }
        } catch (refreshError) {
            processQueue(refreshError, null);
            // 7. Trigger centralized logout logic
            onLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
};

api.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
aiApi.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

export default api;
