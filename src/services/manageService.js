import api from './api';

export const getReviewQueue = (params) =>
  api.get('/manage/leaves', { params }).then((r) => r.data);

export const exportReviewQueueExcel = async (params = {}) => {
  const response = await api.get('/manage/leaves/export', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `review-queue-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const actionLeave = (id, payload) =>
  api.patch(`/manage/leaves/${id}`, payload).then((r) => r.data);

export const getTeam = (params) =>
  api.get('/manage/team', { params }).then((r) => r.data);

export const updateEmployeeRole = (id, role) =>
  api.patch(`/manage/employees/${id}/role`, { role }).then((r) => r.data);

export const getWeeklyDigestPreview = () =>
  api.get('/manage/weekly-digest').then((r) => r.data);

export const sendWeeklyDigestNow = () =>
  api.post('/manage/weekly-digest/send').then((r) => r.data);

export const listDepartments = (params = {}) =>
  api.get('/manage/departments', { params }).then((r) => r.data);

export const createDepartment = (payload) =>
  api.post('/manage/departments', payload).then((r) => r.data);

export const updateDepartment = (id, payload) =>
  api.patch(`/manage/departments/${id}`, payload).then((r) => r.data);

export const deleteDepartment = (id) =>
  api.delete(`/manage/departments/${id}`).then((r) => r.data);
