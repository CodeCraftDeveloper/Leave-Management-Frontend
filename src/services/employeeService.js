import api from './api';

export const updateProfile = (payload) =>
  api.patch('/employees/profile', payload).then((r) => r.data);

export const changePassword = (payload) =>
  api.patch('/employees/password', payload).then((r) => r.data);
