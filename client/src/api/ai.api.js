import api from './client'

export const generateProductDescription = (productId) =>
  api.post(`/ai/products/${productId}/generate-description`).then((r) => r.data)
