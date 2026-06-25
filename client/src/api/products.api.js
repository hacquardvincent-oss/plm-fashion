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

export const getProductVersions = (productId) =>
  apiClient.get(`/products/${productId}/versions`).then(r => r.data)

export const getVersionBom = (productId, versionId) =>
  apiClient.get(`/products/${productId}/versions/${versionId}/bom`).then(r => r.data)

export const createProductVersion = (productId, data) =>
  apiClient.post(`/products/${productId}/versions`, data).then(r => r.data)

export const setCurrentVersion = (productId, versionId) =>
  apiClient.patch(`/products/${productId}/versions/${versionId}/set-current`).then(r => r.data)
