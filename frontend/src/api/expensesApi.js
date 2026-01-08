import axiosClient from "./axiosClient";

export const getVendors = (slug) => {
  return axiosClient.get(`/expenses/${slug}/vendors`);
};

export const createVendor = (slug, vendorData) => {
  return axiosClient.post(`/expenses/${slug}/vendors`, vendorData);
};

export const updateVendor = (slug, id, vendorData) => {
  return axiosClient.patch(`/expenses/${slug}/vendors/${id}`, vendorData);
};

export const createExpense = (slug, expenseData) => {
  return axiosClient.post(`/expenses/${slug}`, expenseData);
};

export const getExpenses = (slug, params) => {
  return axiosClient.get(`/expenses/${slug}`, { params });
};
