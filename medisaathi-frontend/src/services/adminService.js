import api from './api.js';

export const adminService = {
  // Branches
  getBranches: async () => {
    const res = await api.get('/admin/branches');
    return res.data;
  },

  createBranch: async (data) => {
    const res = await api.post('/admin/branches', data);
    return res.data;
  },

  updateBranch: async (id, data) => {
    const res = await api.patch(`/admin/branches/${id}`, data);
    return res.data;
  },

  toggleQueue: async (id) => {
    const res = await api.patch(`/admin/branches/${id}/toggle-queue`);
    return res.data;
  },

  // Staff
  getStaff: async () => {
    const res = await api.get('/admin/staff');
    return res.data;
  },

  createStaff: async (data) => {
    const res = await api.post('/admin/staff', data);
    return res.data;
  },

  removeStaff: async (id) => {
    const res = await api.delete(`/admin/staff/${id}`);
    return res.data;
  },

  // Analytics
  getAnalytics: async (params = {}) => {
    const res = await api.get('/admin/analytics', { params });
    return res.data;
  },
};