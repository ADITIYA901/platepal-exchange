import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, dashboardPathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) void navigate({ to: dashboardPathForRole(role), replace: true });
  }, [loading, role, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading your dashboard…
    </div>
  );
}
