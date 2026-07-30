import api from './api';

export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data);
export const getAllLeaves = (params) => api.get('/admin/leaves', { params }).then((r) => r.data);
export const updateLeaveStatus = (id, payload) =>
  api.patch(`/admin/leaves/${id}`, payload).then((r) => r.data);
export const getEmployees = (params) =>
  api.get('/admin/employees', { params }).then((r) => r.data);
export const listHeads = () =>
  api.get('/admin/heads').then((r) => r.data);
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

export const downloadEmployeeImportTemplate = async () => {
  const response = await api.get('/admin/employees/import/template', {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'employee-import-template.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const importEmployees = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Don't set Content-Type manually — the browser must add the multipart
  // boundary itself, otherwise multer can't parse the upload on the server.
  return api.post('/admin/employees/import', formData).then((r) => r.data);
};

export const exportLeavesExcel = async (params = {}) => {
  const response = await api.get('/admin/leaves/export', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `employee-leaves-${stamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
