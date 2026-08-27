import api from './api';

export const serviceTreeService = {
  getServices: () => api.get('/services'),
  saveServices: (services) => api.post('/services', services),
  updateSettings: (settings) => api.post('/services/update-settings', settings),
  transferRequest: (data) => api.post('/services/transfer-request', data),
  transferAccept: (data) => api.post('/services/transfer-accept', data),
  distributeWaznat: (data) => api.post('/services/distribute-waznat', data),
};

export default serviceTreeService;
