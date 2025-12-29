import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function RoleGuard({ allowedRoles }) {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on what they ARE allowed to see?
    // Or just a 403 Forbidden page.
    return <div className="p-10 text-center text-red-600">Access Forbidden: You do not have permission to view this page.</div>;
  }

  return <Outlet />;
}
