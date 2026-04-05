import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/hooks/use-auth";

const AuthPage = lazy(() =>
  import("@/pages/auth-page").then((module) => ({ default: module.AuthPage })),
);
const LandingPage = lazy(() =>
  import("@/pages/landing-page").then((module) => ({
    default: module.LandingPage,
  })),
);
const JobSeekerPage = lazy(() =>
  import("@/pages/job-seeker-page").then((module) => ({
    default: module.JobSeekerPage,
  })),
);
const RecruiterPage = lazy(() =>
  import("@/pages/recruiter-page").then((module) => ({
    default: module.RecruiterPage,
  })),
);

function DashboardRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="rounded-full border border-border/80 bg-card/80 px-5 py-3 text-sm font-medium text-foreground shadow-glow backdrop-blur">
          Opening your workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <Navigate to={user.role === "recruiter" ? "/recruiter" : "/job-seeker"} replace />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="rounded-full border border-border/80 bg-card/80 px-5 py-3 text-sm font-medium text-foreground shadow-glow backdrop-blur">
            Loading interface...
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute role="jobseeker" />}>
          <Route path="/job-seeker" element={<JobSeekerPage />} />
        </Route>
        <Route element={<ProtectedRoute role="recruiter" />}>
          <Route path="/recruiter" element={<RecruiterPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
