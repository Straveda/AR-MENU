import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/common/Toast/ToastContext";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showError } = useToast();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);

        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          logout();
        } else {
          setRole(decoded.role);
          setRestaurantId(decoded.restaurantId);

          fetchCurrentUser();
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/users/auth/me");

      if (data && data._id) {
        // Preserve the full populated restaurantId object
        const userData = {
          ...data,
          subscriptionStatus: data.restaurantId?.subscriptionStatus
        };
        setUser(userData);
        setRole(data.role);
        setRestaurantId(data.restaurantId?._id);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);

      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (jwtToken) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setRole(null);
    setRestaurantId(null);
  };

  // Listen for global auth:logout event (triggered by 401 interceptor)
  useEffect(() => {
    const handleAuthLogout = (event) => {
      logout();
      navigate("/login");
      // Use a small timeout to ensure toast shows after navigation if needed,
      // though typically ToastContext persists.
      showError("Session expired. Please log in again.");
    };

    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [logout, navigate, showError]);

  const value = {
    token,
    user,
    role,
    restaurantId,
    loading,
    isAuthenticated: !!token,
    isSuperAdmin: role === "SUPER_ADMIN",
    isPlatformAdmin: role === "PLATFORM_ADMIN",
    isRestaurantAdmin: role === "RESTAURANT_ADMIN",
    isStaff: role === "KDS",
    isKDS: role === "KDS",
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
