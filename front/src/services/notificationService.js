import api from './api';

export const notificationService = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: (targetUser) => api.post('/notifications/read-all', { targetUser }),
  getSyncMessages: (params = {}) => api.get('/notifications/sync-messages', { params }),
};

export default notificationService;
