import api from './api';

export const evaluationService = {
  getEvaluations: () => api.get('/evaluations'),
  saveEvaluation: (data) => api.post('/evaluations', data),
  getTemplates: () => api.get('/evaluation-templates'),
  createTemplate: (data) => api.post('/evaluation-templates', data),
  updateTemplate: (id, data) => api.put(`/evaluation-templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/evaluation-templates/${id}`),
  getServantEvaluations: (params = {}) => api.get('/servant-evaluations', { params }),
  saveServantEvaluation: (data) => api.post('/servant-evaluations', data),
  scanServantEvaluation: (data) => api.post('/servant-evaluations/scan', data),
};

export default evaluationService;
