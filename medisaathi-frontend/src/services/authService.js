import api from './api.js';

export const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};