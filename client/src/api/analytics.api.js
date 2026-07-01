import apiClient from './client'

export const getAnalyticsOverview = () =>
  apiClient.get('/analytics/overview').then((r) => r.data)

export const getAnalyticsProducts = () =>
  apiClient.get('/analytics/products').then((r) => r.data)

export const getAnalyticsCollections = () =>
  apiClient.get('/analytics/collections').then((r) => r.data)
