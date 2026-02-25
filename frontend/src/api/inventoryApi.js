import axiosClient from "./axiosClient";

export const getIngredients = (params) => axiosClient.get("/inventory/ingredients", { params });
export const createIngredient = (data) => axiosClient.post("/inventory/ingredients", data);
export const updateIngredient = (id, data) => axiosClient.patch(`/inventory/ingredients/${id}`, data);
export const adjustStock = (id, data) => axiosClient.post(`/inventory/ingredients/${id}/adjust-stock`, data);
export const getStockMovements = (params) => axiosClient.get("/inventory/stock-movements", { params });
export const getVendors = () => axiosClient.get("/expenses/vendors");
