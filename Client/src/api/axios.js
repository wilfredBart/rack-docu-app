import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || 'Er is een fout opgetreden.';
    const isLoginRoute = error.config?.url?.includes('/auth/login');

    if (status === 401 && !isLoginRoute) {
      toast.error('Sessie verlopen. Log opnieuw in.');
      store.dispatch(logout());
      window.location.href = '/auth';
    } else if (isLoginRoute) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;