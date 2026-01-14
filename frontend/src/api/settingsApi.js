import axiosClient from './axiosClient';

const settingsApi = {
  updateProfile: async (data) => {
    
    const response = await axiosClient.put('/settings/profile', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get('/settings/profile');
    return response.data;
  },

  changePassword: async (data) => {
    
    const response = await axiosClient.put('/settings/password', data);
    return response.data;
  },
};

export default settingsApi;
