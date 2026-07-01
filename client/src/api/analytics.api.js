import apiClient from './client'

export const getAnalyticsOverview = () =>
  apiClient.get('/analytics/overview').then((r) => r.data)

export const getAnalyticsProducts = () =>
  apiClient.get('/analytics/products').then((r) => r.data)

export const getAnalyticsCollections = () =>
  apiClient.get('/analytics/collections').then((r) => r.data)

// ── Performance commerciale (sell-in réalisé) ──
export const getCommercialOverview = () =>
  apiClient.get('/analytics/commercial/overview').then((r) => r.data)

export const getCommercialProducts = () =>
  apiClient.get('/analytics/commercial/products').then((r) => r.data)

export const getCommercialCollections = () =>
  apiClient.get('/analytics/commercial/collections').then((r) => r.data)

export const getCommercialFunnel = () =>
  apiClient.get('/analytics/commercial/funnel').then((r) => r.data)
