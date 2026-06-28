import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const { token } = JSON.parse(user);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: Partial<{ name: string; email: string; password: string; address: unknown }>) =>
    api.put('/auth/profile', data),
};

export const productAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  createReview: (id: string, data: { rating: number; title: string; comment: string }) =>
    api.post(`/products/${id}/reviews`, data),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (productId: string, quantity?: number) =>
    api.post('/cart/add', { productId, quantity }),
  update: (itemId: string, quantity: number) =>
    api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const orderAPI = {
  create: (data: { shippingAddress: unknown; paymentMethod: string }) =>
    api.post('/orders', data),
  getMine: () => api.get('/orders/mine'),
  getById: (id: string) => api.get(`/orders/${id}`),
  pay: (id: string, data: unknown) => api.put(`/orders/${id}/pay`, data),
  getAll: () => api.get('/orders/all'),
  updateStatus: (id: string, data: { status?: string; isDelivered?: boolean }) =>
    api.put(`/orders/${id}/status`, data),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data: { name: string; slug: string; image?: string }) =>
    api.post('/categories', data),
};

export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId: string) => api.post('/wishlist/add', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  getStats: () => api.get('/admin/stats'),
  createAdmin: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/create-admin', data),
};

export default api;
