import axiosClient from "./axiosClient";

export const getAllDishes = () => {
  return axiosClient.get("/dishes/getdishes");
};

export const deleteDish = (id) => {
  return axiosClient.delete(`/dishes/deletedish/${id}`);
};

export const getModelStatus = (id) => {
  return axiosClient.get(`/dishes/${id}/model-status`);
};

export const generateModel = (id) => {
  return axiosClient.post(`/dishes/${id}/generate-model`);
};

export const retryModelGeneration = (id) => {
  return axiosClient.post(`/dishes/${id}/retry-model`);
};

export const updateDishAvailability = (id, available) => {
  return axiosClient.put(`/dishes/updatedish/${id}`, { available });
};


