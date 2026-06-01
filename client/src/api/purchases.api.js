// client/src/api/purchases.api.js
import apiClient from './client'

export const getPurchases   = () => apiClient.get('/purchases').then(r => r.data)
export const getPurchase    = (id) => apiClient.get(`/purchases/${id}`).then(r => r.data)
export const getPurchaseStats = () => apiClient.get('/purchases/stats').then(r => r.data)
export const createPurchase = (data) => apiClient.post('/purchases', data).then(r => r.data)
export const updatePurchase = (id, data) => apiClient.patch(`/purchases/${id}`, data).then(r => r.data)
export const deletePurchase = (id) => apiClient.delete(`/purchases/${id}`).then(r => r.data)
export const receiveLine    = (lineId, data) => apiClient.patch(`/purchases/lines/${lineId}/receive`, data).then(r => r.data)
