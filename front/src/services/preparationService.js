import api from './api';

export const preparationService = {
  getPreparations: () => api.get('/preparations'),
  createPreparation: (data) => api.post('/preparations', data),
  deletePreparation: (id) => api.delete(`/preparations/${id}`),
  getSubmissions: () => api.get('/preparations/submissions'),
  submitPreparation: (data) => api.post('/preparations/submit', data),
  evaluateSubmission: (id, data) => api.post(`/preparations/submissions/${id}/evaluate`, data),
};

export default preparationService;
