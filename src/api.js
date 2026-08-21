import axios from 'axios';
import router from './router/index';

const api = axios.create({

    baseURL: '/api/'
    // baseURL: 'http://localhost:8080/api/'
    // baseURL: 'http://192.168.0.180:8080'
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem("user-token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Токен устарел или неверный. Перенаправление на логин...");
            localStorage.removeItem("user-token");
            router.push('login')
        }
        return Promise.reject(error);
    }
);

export default api;