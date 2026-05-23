import api from './api';

export const loginUser = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);

export const loginEmployee = (employeeId, password) =>
  loginUser(employeeId, password);

export const loginAdmin = (email, password) =>
  loginUser(email, password);

export const getMe = () => api.get('/auth/me', { silent: true }).then((r) => r.data);

export const setEmail = (email) =>
  api.put('/auth/email', { email }).then((r) => r.data);
