import api from './api';

export const makhdomeenService = {
  getMakhdomeen: (params = {}) => api.get('/makhdomeen', { params }),
  createMakhdoom: (data) => api.post('/makhdomeen', data),
  updateMakhdoom: (id, data) => api.put(`/makhdomeen/${id}`, data),
  deleteMakhdoom: (id) => api.delete(`/makhdomeen/${id}`),
  batchUpdate: (updates) => api.post('/makhdomeen/batch-update', { updates }),
  renameClass: (data) => api.post('/makhdomeen/rename-class', data),
  promoteMakhdoom: (id, data) => api.post(`/makhdomeen/${id}/promote`, data),
};

export default makhdomeenService;
