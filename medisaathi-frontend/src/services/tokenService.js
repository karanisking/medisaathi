import api from './api.js';

export const tokenService = {
  join: async (data) => {
    const res = await api.post('/tokens', data);
    return res.data;
  },

  getMine: async () => {
    const res = await api.get('/tokens/mine');
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get('/tokens/history');
    return res.data;
  },

  leave: async (tokenId) => {
    const res = await api.delete(`/tokens/${tokenId}/leave`);
    return res.data;
  },
};