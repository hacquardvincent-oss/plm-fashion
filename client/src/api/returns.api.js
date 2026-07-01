import apiClient from './client'

// Recommandations ciblées pour une fiche (type / famille / sous-famille)
export const getReturnInsights = (params) =>
  apiClient.get('/returns/insights', { params }).then((r) => r.data)

// Base de connaissance complète
export const getAllReturnInsights = () =>
  apiClient.get('/returns').then((r) => r.data)

export const createReturnInsight = (data) =>
  apiClient.post('/returns', data).then((r) => r.data)
