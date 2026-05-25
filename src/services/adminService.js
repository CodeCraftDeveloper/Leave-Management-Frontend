import api from './api';

export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data);
export const getAllLeaves = (params) => api.get('/admin/leaves', { params }).then((r) => r.data);
export const updateLeaveStatus = (id, payload) =>
  api.patch(`/admin/leaves/${id}`, payload).then((r) => r.data);
export const getEmployees = (params) =>
  api.get('/admin/employees', { params }).then((r) => r.data);
export const createEmployee = (payload) =>
  api.post('/admin/employees', payload).then((r) => r.data);
export const getEmployeeDetail = (id) =>
  api.get(`/admin/employees/${id}`).then((r) => r.data);
export const updateEmployee = (id, payload) =>
  api.patch(`/admin/employees/${id}`, payload).then((r) => r.data);
export const deleteEmployee = (id) =>
  api.delete(`/admin/employees/${id}`).then((r) => r.data);
export const updateEmployeeWorkDetails = (id, payload) =>
  api.patch(`/admin/employees/${id}/work-details`, payload).then((r) => r.data);

export const applyLeaveOnBehalf = (payload) =>
  api.post('/admin/leaves', payload).then((r) => r.data);
