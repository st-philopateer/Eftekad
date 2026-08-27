import api from './api';

export const visitationService = {
  saveVisitation: (data) => api.post('/servant-visitations', data),
};

export default visitationService;
