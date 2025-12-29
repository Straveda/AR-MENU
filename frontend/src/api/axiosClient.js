// axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response) {
      if (response.status === 401) {
        // 401 Unauthorized -> Logout
        localStorage.removeItem("token");
        // Dispatch event so AuthProvider can react
        window.dispatchEvent(new Event("auth:logout"));
      } else if (response.status === 403) {
        // 403 Forbidden -> Plan Limit or Role Restriction
        // NEVER logout on 403.
        console.warn("Access Forbidden: Plan limit or Role restriction.");
        // Dispatch event for UI to show upgrade modal/toast
        const event = new CustomEvent("saas:forbidden", { detail: response.data });
        window.dispatchEvent(event);
      } else if (response.status === 400) {
         // 400 Bad Request -> Could be validation OR Plan Limit
         // Check if message implies limit
         if (response.data?.message?.toLowerCase().includes("limit")) {
             const event = new CustomEvent("saas:limit-reached", { detail: response.data });
             window.dispatchEvent(event);
         }
      } else if (response.status === 423) {
          // 423 Locked -> Account Suspended
          const event = new CustomEvent("saas:suspended", { detail: response.data });
          window.dispatchEvent(event);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
