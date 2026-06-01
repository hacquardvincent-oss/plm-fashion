// client/src/api/purchases.api.js
import api from './api'

export const getPurchases   = () => api.get('/purchases').then(r => r.data)
export const getPurchase    = (id) => api.get(`/purchases/${id}`).then(r => r.data)
export const getPurchaseStats = () => api.get('/purchases/stats').then(r => r.data)
export const createPurchase = (data) => api.post('/purchases', data).then(r => r.data)
export const updatePurchase = (id, data) => api.patch(`/purchases/${id}`, data).then(r => r.data)
export const deletePurchase = (id) => api.delete(`/purchases/${id}`).then(r => r.data)
export const receiveLine    = (lineId, data) => api.patch(`/purchases/lines/${lineId}/receive`, data).then(r => r.data)
