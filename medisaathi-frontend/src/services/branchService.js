import api from './api.js';

export const branchService = {
  getById: async (id) => {
    const res = await api.get(`/branches/${id}`);
    return res.data;
  },

  getQueueStatus: async (id) => {
    const res = await api.get(`/branches/${id}/queue-status`);
    return res.data;
  },
};