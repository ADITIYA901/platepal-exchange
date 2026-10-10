import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { DonationCard } from "@/components/donation-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — FoodLoop" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role ?? "donor",
      }));
    },
  });

  const donations = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function verifyNgo(id: string) {
    const { error } = await supabase.from("profiles").update({ verified: true }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("NGO verified");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  }

  async function removeDonation(id: string) {
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Donation removed");
      void queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
    }
  }

  if (role && role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
          This area is for administrators only.
        </main>
      </div>
    );
  }

  const ngos = (users.data ?? []).filter((u) => u.role === "ngo");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
        <p className="text-muted-foreground">Manage users, verify NGOs and monitor donations.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{users.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">Total users</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{ngos.length}</div><div className="text-xs text-muted-foreground">NGOs</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{donations.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">Donations</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{ngos.filter((n) => !n.verified).length}</div><div className="text-xs text-muted-foreground">Pending verification</div></CardContent></Card>
        </div>

        <Tabs defaultValue="users" className="mt-8">
          <TabsList>
            <TabsTrigger value="users">Users & NGOs</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4 space-y-3">
            {users.data?.map((u) => (
              <Card key={u.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-semibold">{u.full_name || "Unnamed"} {u.org_name ? `· ${u.org_name}` : ""}</div>
                    <div className="text-xs text-muted-foreground">{u.address ?? "No address"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{u.role}</Badge>
                    {u.role === "ngo" &&
                      (u.verified ? (
                        <Badge className="bg-primary text-primary-foreground"><ShieldCheck className="mr-1 h-3 w-3" /> Verified</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => verifyNgo(u.id)}>
                          <UserCheck className="mr-1 h-3 w-3" /> Verify
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="donations" className="mt-4 space-y-4">
            {donations.data?.map((d) => (
              <DonationCard key={d.id} donation={d} actions={
                <Button size="sm" variant="ghost" onClick={() => removeDonation(d.id)}>Remove</Button>
              } />
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
