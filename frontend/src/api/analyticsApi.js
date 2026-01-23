import axiosClient from "./axiosClient";

export const getDashboardAnalytics = () => {
  return axiosClient.get("/analytics/dashboard");
};

export const getDetailedAnalytics = (timeRange = 'week') => {
  return axiosClient.get("/analytics/detailed", {
    params: { timeRange }
  });
};

