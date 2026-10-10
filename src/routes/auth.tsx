import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, dashboardPathForRole, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "register" ? ("register" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign In — FoodLoop" },
      { name: "description", content: "Sign in or create your FoodLoop account." },
      { property: "og:title", content: "Sign In — FoodLoop" },
      { property: "og:description", content: "Sign in or create your FoodLoop account." },
    ],
  }),
  component: AuthPage,
});

const DEMO_ACCOUNTS: { label: string; email: string; role: string }[] = [
  { label: "Donor", email: "donor@foodloop.demo", role: "donor" },
  { label: "NGO", email: "ngo@foodloop.demo", role: "ngo" },
  { label: "Volunteer", email: "volunteer@foodloop.demo", role: "volunteer" },
  { label: "Admin", email: "admin@foodloop.demo", role: "admin" },
];

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<AppRole>("donor");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!auth.loading && auth.userId) {
    void navigate({ to: dashboardPathForRole(auth.role), replace: true });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, org_name: orgName || null, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setConfirmSent(true);
  }

  async function loginAsDemo(demoEmail: string) {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: "foodloop123",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Signed in with demo account");
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/40">
      <div className="flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold">FoodLoop</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {mode === "login" ? "Welcome back" : "Join FoodLoop"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to your account to continue."
                : "Create an account as a donor, NGO or volunteer."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {confirmSent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <MailCheck className="h-10 w-10 text-primary" />
                <p className="font-semibold">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
                  account, then sign in.
                </p>
                <Button variant="outline" onClick={() => setConfirmSent(false)}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
                  {mode === "register" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="role">I am a</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                          <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="donor">Food Donor (restaurant, hotel, household)</SelectItem>
                            <SelectItem value="ngo">NGO / Charity</SelectItem>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {role === "ngo" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="org">Organization name</Label>
                          <Input id="org" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                  </Button>
                </form>

                <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogle}>
                  Continue with Google
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {mode === "login" ? (
                    <>New here? <Link to="/auth" search={{ mode: "register" }} className="font-semibold text-primary">Create an account</Link></>
                  ) : (
                    <>Already have an account? <Link to="/auth" search={{ mode: "login" }} className="font-semibold text-primary">Sign in</Link></>
                  )}
                </p>

                <div className="mt-6 rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Demo accounts (password: foodloop123)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEMO_ACCOUNTS.map((d) => (
                      <Button key={d.email} size="sm" variant="secondary" disabled={busy} onClick={() => loginAsDemo(d.email)}>
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
