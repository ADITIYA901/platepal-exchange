import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  role: AppRole | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    userId: null,
    email: null,
    profile: null,
    role: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load(userId: string, email: string | null) {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setState({
        loading: false,
        userId,
        email,
        profile: profile ?? null,
        role: (roles?.[0]?.role as AppRole | undefined) ?? null,
      });
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) void load(data.user.id, data.user.email ?? null);
      else setState({ loading: false, userId: null, email: null, profile: null, role: null });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (session?.user) void load(session.user.id, session.user.email ?? null);
      else setState({ loading: false, userId: null, email: null, profile: null, role: null });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function dashboardPathForRole(role: AppRole | null): string {
  switch (role) {
    case "donor":
      return "/my-donations";
    case "ngo":
      return "/browse";
    case "volunteer":
      return "/tasks";
    case "admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}
