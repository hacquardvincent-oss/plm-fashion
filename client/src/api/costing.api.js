import apiClient from './client'

export const getCosting = (productId) =>
  apiClient.get(`/costing/${productId}`).then((r) => r.data)

export const getCostingHistory = (productId) =>
  apiClient.get(`/costing/${productId}/history`).then((r) => r.data)

export const saveCosting = (productId, data) =>
  apiClient.post(`/costing/${productId}`, data).then((r) => r.data)
