import api from './api';

export const attendanceService = {
  getAttendance: (params = {}) => api.get('/attendance', { params }),
  saveAttendance: (data) => api.post('/attendance', data),
};

export default attendanceService;
