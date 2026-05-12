import apiClient from './client'

export const getProducts = (params) =>
  apiClient.get('/products', { params }).then((r) => r.data)

export const getProduct = (id) =>
  apiClient.get(`/products/${id}`).then((r) => r.data)

export const createProduct = (data) =>
  apiClient.post('/products', data).then((r) => r.data)

export const updateProduct = (id, data) =>
  apiClient.patch(`/products/${id}`, data).then((r) => r.data)

export const addBomLine = (productId, data) =>
  apiClient.post(`/products/${productId}/bom`, data).then((r) => r.data)

export const deleteBomLine = (productId, bomId) =>
  apiClient.delete(`/products/${productId}/bom/${bomId}`).then((r) => r.data)

export const addVariant = (productId, data) =>
  apiClient.post(`/products/${productId}/variants`, data).then((r) => r.data)
