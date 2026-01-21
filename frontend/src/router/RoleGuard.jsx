import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function RoleGuard({ allowedRoles }) {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {

    return <div className="p-10 text-center text-red-600">Access Forbidden: You do not have permission to view this page.</div>;
  }

  return <Outlet />;
}
