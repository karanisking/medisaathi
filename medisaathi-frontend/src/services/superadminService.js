import api from './api.js';

export const superAdminService = {
  // Hospitals
  getHospitals: async (params = {}) => {
    const res = await api.get('/superadmin/hospitals', { params });
    return res.data;
  },

  createHospital: async (data) => {
    const res = await api.post('/superadmin/hospitals', data);
    return res.data;
  },

  updateHospital: async (id, data) => {
    const res = await api.patch(`/superadmin/hospitals/${id}`, data);
    return res.data;
  },

  // Admins
  createAdmin: async (data) => {
    const res = await api.post('/superadmin/admins', data);
    return res.data;
  },

  // Analytics
  getPlatformAnalytics: async (params = {}) => {
    const res = await api.get('/superadmin/analytics', { params });
    return res.data;
  },

  getHospitalAdmins: async (hospitalId) => {
    const res = await api.get(`/superadmin/hospitals/${hospitalId}/admins`);
    return res.data;
  },
  
  updateAdmin: async (adminId, data) => {
    const res = await api.patch(`/superadmin/admins/${adminId}`, data);
    return res.data;
  },
  
  deleteAdmin: async (adminId) => {
    const res = await api.delete(`/superadmin/admins/${adminId}`);
    return res.data;
  },
};