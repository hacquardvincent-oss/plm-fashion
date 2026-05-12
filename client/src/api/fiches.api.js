import api from './client'

export const getFiche         = (productId) =>
  api.get(`/fiches/${productId}`).then((r) => r.data)

export const generateFiche    = (productId) =>
  api.post(`/fiches/${productId}/generate`).then((r) => r.data)

export const updateFiche      = (productId, data) =>
  api.patch(`/fiches/${productId}`, data).then((r) => r.data)

export const exportFicheUrl   = (productId, type) =>
  `${api.defaults.baseURL}/fiches/${productId}/export/${type}`
