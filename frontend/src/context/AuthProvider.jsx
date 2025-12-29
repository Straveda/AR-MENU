import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiry
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          logout();
        } else {
          setRole(decoded.role);
          setRestaurantId(decoded.restaurantId);
          // Hydrate user details from API if needed, or just use decoded token data for basic checks
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
      // Backend /me endpoint returns user object directly
      if (data && data._id) {
        setUser(data);
        // Ensure state matches API source of truth
        setRole(data.role);
        setRestaurantId(data.restaurantId);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // If 401, interceptor might handle it, but we should clear state
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

  const value = {
    token,
    user,
    role,
    restaurantId,
    loading,
    isAuthenticated: !!token,
    isSuperAdmin: role === "SUPER_ADMIN",
    isRestaurantAdmin: role === "RESTAURANT_ADMIN",
    isStaff: ["KDS", "WAITER", "CASHIER"].includes(role),
    isKDS: role === "KDS",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
