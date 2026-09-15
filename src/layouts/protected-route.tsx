import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { PageSpinner } from "@/components/common/spinner";

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner label="Loading your account" />;
  if (!user) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;

  return <Outlet />;
}

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner label="Checking permissions" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export { ProtectedRoute, AdminRoute };
