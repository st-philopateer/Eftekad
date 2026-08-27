import api from './api';

export const stageListService = {
  getStagesList: () => api.get('/stages-list'),
  createStage: (data) => api.post('/stages-list', data),
  updateStage: (id, data) => api.put(`/stages-list/${id}`, data),
  deleteStage: (id) => api.delete(`/stages-list/${id}`),
  promoteStage: (data) => api.post('/stages-list/promote', data),
};

export default stageListService;
