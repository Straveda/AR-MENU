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

  // We need to determine if we are in a "public" route (slug-based) or "private" route (auth-based)
  // Simple heuristic: if URL starts with /r/, it's public.
  const location = useLocation();
  const params = useParams(); // Note: useParams might not be available here if Provider is too high up.  
  // Actually, useParams works ONLY if rendered INSIDE a Route. Ideally TenantProvider should be inside Router.
  // But if it wraps App, we might need manual parsing or rely on child components to trigger fetch.
  
  // STRATEGY: Expose a 'resolveTenant' function? 
  // BETTER STRATEGY:  For now, let's try to grab slug from pathmanually if useParams is empty (which it is at top level)
  
  const getSlugFromPath = () => {
    const match = location.pathname.match(/\/r\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const slug = getSlugFromPath();

  // Tenant resolution logic strictly following the matrix
  useEffect(() => {
    const resolveTenant = async () => {
      setLoading(true);
      setError(null);

      const path = location.pathname;

      // 1. Platform Route -> No Tenant
      if (path.startsWith("/platform")) {
        setRestaurant(null);
        setLoading(false);
        return;
      }

      // 2. Public Route (/r/:slug) -> Slug ONLY
      // Simple regex check for /r/:slug start
      const publicMatch = path.match(/^\/r\/([^\/]+)/);
      if (publicMatch) {
         const slugFromUrl = publicMatch[1];
         // STRICT: Slug only. Do not look at auth.
         setRestaurant({ slug: slugFromUrl }); 
         setLoading(false);
         return;
      }

      // 3. Protected Route (/admin, /staff) -> JWT ONLY
      if (path.startsWith("/admin") || path.startsWith("/staff")) {
        if (authRestaurantId) {
             // Use ID from authenticated token
             setRestaurant({ id: authRestaurantId }); 
        } else {
             // If we are here but don't have an ID, it might be a race condition with AuthProvider
             // or the user is not logged in yet. 
             // If AuthProvider is loading, we wait. If Auth says not auth, we set null.
             setRestaurant(null);
        }
        setLoading(false);
        return;
      }

      // 4. Fallback (e.g. Login page, Home, etc) -> No Tenant
      setRestaurant(null);
      setLoading(false);
    };

    resolveTenant();
  }, [location.pathname, authRestaurantId]);

  const value = {
    restaurant,
    loading,
    error,
    slug // Export slug for easy access
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
