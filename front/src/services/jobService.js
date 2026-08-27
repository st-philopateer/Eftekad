import api from './api';

export const jobService = {
  getJobs: () => api.get('/jobs'),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
};

export default jobService;
