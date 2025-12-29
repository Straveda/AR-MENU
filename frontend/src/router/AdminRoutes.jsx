import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function AdminRoutes({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
