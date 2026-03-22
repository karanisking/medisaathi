import api from './api.js';

export const staffService = {
  getLiveQueue: async () => {
    const res = await api.get('/staff/queue');
    return res.data;
  },

  callNext: async () => {
    const res = await api.post('/staff/queue/next');
    return res.data;
  },

  skipToken: async (tokenId) => {
    const res = await api.post(`/staff/tokens/${tokenId}/skip`);
    return res.data;
  },

  completeToken: async (tokenId) => {
    const res = await api.post(`/staff/tokens/${tokenId}/complete`);
    return res.data;
  },

  pauseQueue: async () => {
    const res = await api.post('/staff/queue/pause');
    return res.data;
  },

  resumeQueue: async () => {
    const res = await api.post('/staff/queue/resume');
    return res.data;
  },
};