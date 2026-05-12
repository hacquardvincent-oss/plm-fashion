import apiClient from './client'

export const getCollections = (params) =>
  apiClient.get('/collections', { params }).then((r) => r.data)

export const getCollection = (id) =>
  apiClient.get(`/collections/${id}`).then((r) => r.data)

export const createCollection = (data) =>
  apiClient.post('/collections', data).then((r) => r.data)

export const updateCollection = (id, data) =>
  apiClient.patch(`/collections/${id}`, data).then((r) => r.data)

export const deleteCollection = (id) =>
  apiClient.delete(`/collections/${id}`).then((r) => r.data)
