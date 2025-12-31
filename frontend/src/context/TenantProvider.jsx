import { createContext, useState, useEffect, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "./AuthProvider";

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export default function TenantProvider({ children }) {
  const { restaurantId: authRestaurantId, isSuperAdmin } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const params = useParams(); 

  const getSlugFromPath = () => {
    const match = location.pathname.match(/\/r\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const slug = getSlugFromPath();

  useEffect(() => {
    const resolveTenant = async () => {
      setLoading(true);
      setError(null);

      const path = location.pathname;

      if (path.startsWith("/platform")) {
        setRestaurant(null);
        setLoading(false);
        return;
      }

      const publicMatch = path.match(/^\/r\/([^\/]+)/);
      if (publicMatch) {
         const slugFromUrl = publicMatch[1];
         
         setRestaurant({ slug: slugFromUrl }); 
         setLoading(false);
         return;
      }

      if (path.startsWith("/admin") || path.startsWith("/staff")) {
        if (authRestaurantId) {
             
             setRestaurant({ id: authRestaurantId }); 
        } else {

             setRestaurant(null);
        }
        setLoading(false);
        return;
      }

      setRestaurant(null);
      setLoading(false);
    };

    resolveTenant();
  }, [location.pathname, authRestaurantId]);

  const value = {
    restaurant,
    loading,
    error,
    slug 
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
