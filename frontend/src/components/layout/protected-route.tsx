import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/api";

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="rounded-full border border-border/80 bg-card/80 px-5 py-3 text-sm font-medium text-foreground shadow-glow backdrop-blur">
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "recruiter" ? "/recruiter" : "/job-seeker"} replace />;
  }

  return <Outlet />;
}
