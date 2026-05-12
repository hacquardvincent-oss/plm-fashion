import apiClient from './client'

export const getWorkflows = (params) =>
  apiClient.get('/workflows', { params }).then((r) => r.data)

export const createWorkflow = (data) =>
  apiClient.post('/workflows', data).then((r) => r.data)

export const decideWorkflow = (id, data) =>
  apiClient.patch(`/workflows/${id}/decide`, data).then((r) => r.data)

export const addComment = (id, data) =>
  apiClient.post(`/workflows/${id}/comments`, data).then((r) => r.data)

export const getComments = (id) =>
  apiClient.get(`/workflows/${id}/comments`).then((r) => r.data)
