import apiClient from './client'

export const getSuppliers = (params) =>
  apiClient.get('/suppliers', { params }).then((r) => r.data)

export const getSupplier = (id) =>
  apiClient.get(`/suppliers/${id}`).then((r) => r.data)

export const createSupplier = (data) =>
  apiClient.post('/suppliers', data).then((r) => r.data)

export const addEvaluation = (id, data) =>
  apiClient.post(`/suppliers/${id}/evaluations`, data).then((r) => r.data)
