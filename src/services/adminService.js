import api from './api';

export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data);
export const getAllLeaves = (params) => api.get('/admin/leaves', { params }).then((r) => r.data);
export const updateLeaveStatus = (id, payload) =>
  api.patch(`/admin/leaves/${id}`, payload).then((r) => r.data);
export const getEmployees = (params) =>
  api.get('/admin/employees', { params }).then((r) => r.data);
export const getEmployeeDetail = (id) =>
  api.get(`/admin/employees/${id}`).then((r) => r.data);

export const applyLeaveOnBehalf = (payload) =>
  api.post('/admin/leaves', payload).then((r) => r.data);
