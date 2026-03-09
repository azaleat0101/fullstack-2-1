import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  getProducts: () => apiClient.get('/products').then(res => res.data),
  getProductById: (id) => apiClient.get(`/products/${id}`).then(res => res.data),
  createProduct: (product) => apiClient.post('/products', product).then(res => res.data),
  updateProduct: (id, product) => apiClient.patch(`/products/${id}`, product).then(res => res.data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`).then(res => res.data)
};