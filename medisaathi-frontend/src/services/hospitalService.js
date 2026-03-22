import api from './api.js';

export const hospitalService = {
  getAll: async (params = {}) => {
    const res = await api.get('/hospitals', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/hospitals/${id}`);
    return res.data;
  },
};