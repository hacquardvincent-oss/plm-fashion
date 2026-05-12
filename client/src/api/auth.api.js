import apiClient from './client'

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password }).then((r) => r.data)

export const getMe = () =>
  apiClient.get('/auth/me').then((r) => r.data)

export const logout = () =>
  apiClient.post('/auth/logout').then((r) => r.data)

export const changePassword = (currentPassword, newPassword) =>
  apiClient.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data)
