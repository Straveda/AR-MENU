import axiosClient from "./axiosClient";

export const getDashboardAnalytics = () => {
  return axiosClient.get("/analytics/dashboard");
};
