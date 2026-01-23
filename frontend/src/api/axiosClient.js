
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;
    if (response) {
      if (response.status === 401) {
        // Skip global logout redirect for:
        // 1. Explicit login requests
        // 2. Public feature checks
        // 3. Any request while viewing a public menu route
        const isLoginRequest = config.url.includes("/users/auth/login");
        const isPublicApiRequest = config.url.includes("/features/public/");
        const isPublicMenuRoute = window.location.pathname.startsWith("/r/");

        if (!isLoginRequest && !isPublicApiRequest && !isPublicMenuRoute) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth:logout"));
        } else if (isPublicMenuRoute) {
          // Just clear token but don't redirect if we are on a public page
          localStorage.removeItem("token");
          console.log("Session expired on public route - falling back to guest mode");
        }
      } else if (response.status === 403) {

        console.warn("Access Forbidden: Plan limit or Role restriction.");

        const event = new CustomEvent("saas:forbidden", { detail: response.data });
        window.dispatchEvent(event);
      } else if (response.status === 400) {

        if (response.data?.message?.toLowerCase().includes("limit")) {
          const event = new CustomEvent("saas:limit-reached", { detail: response.data });
          window.dispatchEvent(event);
        }
      } else if (response.status === 423) {

        const event = new CustomEvent("saas:suspended", { detail: response.data });
        window.dispatchEvent(event);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
