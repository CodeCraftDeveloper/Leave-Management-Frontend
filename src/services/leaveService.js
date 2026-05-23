import api from './api';

export const applyLeave = (formData) =>
  api.post('/leaves', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const getMyLeaves = (params) => api.get('/leaves/mine', { params }).then((r) => r.data);
export const getMySummary = () => api.get('/leaves/summary').then((r) => r.data);
export const getLeave = (id) => api.get(`/leaves/${id}`).then((r) => r.data);
export const cancelLeave = (id) => api.patch(`/leaves/${id}/cancel`).then((r) => r.data);
export const getCalendarLeaves = (params) =>
  api.get('/leaves/calendar', { params }).then((r) => r.data);

export const getHolidays = () => api.get('/holidays').then((r) => r.data);
export const createHoliday = (data) => api.post('/holidays', data).then((r) => r.data);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`).then((r) => r.data);
