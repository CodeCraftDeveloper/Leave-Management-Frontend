import api from './api';

export const getHolidays = () => api.get('/holidays').then((r) => r.data);
export const createHoliday = (payload) => api.post('/holidays', payload).then((r) => r.data);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`).then((r) => r.data);
