import axios from 'axios';

const API_BASE_URL = 'https://mytube-8d30.onrender.com/api/v1/';


const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // The refresh token call will now correctly use the hardcoded base URL
                const refreshResponse = await axiosClient.post('/users/refresh-token');
                const newAccessToken = refreshResponse.data.data.accessToken;
                
                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed, logging out.", refreshError);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
