import axiosClient from "./axiosClient";

export const getStaff = async () => {
  try {
    const response = await axiosClient.get("/admin/get-staff");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createStaff = async (staffData) => {
  try {
    const response = await axiosClient.post("/admin/create-staff", staffData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateStaff = async (userId, staffData) => {
    try {
        const response = await axiosClient.patch(`/admin/update-staff/${userId}`, staffData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const toggleStaffStatus = async (userId) => {
  try {
    const response = await axiosClient.patch(`/admin/toggle-staff-status/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteStaff = async (userId) => {
  try {
    const response = await axiosClient.delete(`/admin/delete-staff/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
