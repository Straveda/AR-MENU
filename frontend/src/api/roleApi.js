import axiosClient from "./axiosClient";

export const getRoles = async () => {
  return await axiosClient.get("/roles");
};

export const createRole = async (roleData) => {
  return await axiosClient.post("/roles", roleData);
};

export const updateRole = async (id, roleData) => {
  return await axiosClient.put(`/roles/${id}`, roleData);
};

export const deleteRole = async (id) => {
  return await axiosClient.delete(`/roles/${id}`);
};
