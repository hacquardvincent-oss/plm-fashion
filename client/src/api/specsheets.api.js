import client from './client';

export const getSpecSheet = (productId) =>
  client.get(`/spec-sheets/${productId}`).then((r) => r.data);

export const getSpecSheetHistory = (productId) =>
  client.get(`/spec-sheets/${productId}/history`).then((r) => r.data);

export const saveSpecSheet = (productId, data) =>
  client.put(`/spec-sheets/${productId}`, data).then((r) => r.data);

export const addComment = (productId, data) =>
  client.patch(`/spec-sheets/${productId}/commentaires`, data).then((r) => r.data);

export const createNewVersion = (productId) =>
  client.post(`/spec-sheets/${productId}/new-version`).then((r) => r.data);
