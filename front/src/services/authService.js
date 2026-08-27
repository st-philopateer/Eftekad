import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/priests/forgot-password', { email }),
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateProfile: (data) => api.post('/users/update-profile', data),
  adminUpdateUser: (data) => api.post('/users/admin-update', data),
  updateProfilePic: (data) => api.post('/users/profile-pic', data),
  deleteProfilePic: (username) => api.delete('/users/profile-pic', { data: { username } }),
  deleteUser: (username) => api.delete(`/users/${encodeURIComponent(username)}`),
};

export default authService;
