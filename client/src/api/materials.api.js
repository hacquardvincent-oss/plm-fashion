import apiClient from './client'

export const getMaterials = (params) =>
  apiClient.get('/materials', { params }).then((r) => r.data)

export const getMaterial = (id) =>
  apiClient.get(`/materials/${id}`).then((r) => r.data)

export const createMaterial = (data) =>
  apiClient.post('/materials', data).then((r) => r.data)

export const updateMaterial = (id, data) =>
  apiClient.patch(`/materials/${id}`, data).then((r) => r.data)

export const validateMaterial = (id) =>
  apiClient.patch(`/materials/${id}/validate`).then((r) => r.data)
