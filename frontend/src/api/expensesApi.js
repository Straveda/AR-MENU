import axiosClient from "./axiosClient";

export const getVendors = () => {
  return axiosClient.get(`/expenses/vendors`);
};

export const createVendor = (vendorData) => {
  return axiosClient.post(`/expenses/vendors`, vendorData);
};

export const updateVendor = (id, vendorData) => {
  return axiosClient.patch(`/expenses/vendors/${id}`, vendorData);
};

export const createExpense = (expenseData) => {
  return axiosClient.post(`/expenses`, expenseData);
};

export const getExpenses = (params) => {
  return axiosClient.get(`/expenses`, { params });
};
