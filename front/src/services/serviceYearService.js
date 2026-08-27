import api from './api';

export const serviceYearService = {
  getServiceYears: () => api.get('/service-years'),
  createServiceYear: (data) => api.post('/service-years', data),
  updateServiceYear: (oldYear, data) => api.put(`/service-years/${oldYear}`, data),
  deleteServiceYear: (year) => api.delete(`/service-years/${year}`),
};

export default serviceYearService;
