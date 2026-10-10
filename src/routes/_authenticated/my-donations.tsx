import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { matchNgos, type NgoMatch } from "@/lib/matching";
import type { Database } from "@/integrations/supabase/types";
import { SiteHeader } from "@/components/site-header";
import { DonationCard } from "@/components/donation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Donation = Database["public"]["Tables"]["donations"]["Row"];

export const Route = createFileRoute("/_authenticated/my-donations")({
  head: () => ({ meta: [{ title: "My Donations — FoodLoop" }] }),
  component: MyDonationsPage,
});

function MyDonationsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [matches, setMatches] = useState<{ donation: Donation; list: NgoMatch[] } | null>(null);

  const donations = useQuery({
    queryKey: ["my-donations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function showMatches(donation: Donation) {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "ngo");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      toast.info("No NGOs registered yet");
      return;
    }
    const { data: ngos } = await supabase.from("profiles").select("*").in("id", ids);
    setMatches({ donation, list: matchNgos(donation, ngos ?? []) });
  }

  async function cancelDonation(id: string) {
    const { error } = await supabase.from("donations").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Donation cancelled");
      void queryClient.invalidateQueries({ queryKey: ["my-donations"] });
    }
  }

  const stats = (donations.data ?? []).reduce(
    (acc, d) => {
      acc.total += Number(d.quantity_kg);
      if (d.status === "delivered") acc.delivered += Number(d.quantity_kg);
      if (d.status === "available") acc.active += 1;
      return acc;
    },
    { total: 0, delivered: 0, active: 0 },
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">My donations</h1>
            <p className="text-muted-foreground">Track and manage everything you've posted.</p>
          </div>
          <Button asChild>
            <Link to="/donate"><Plus className="mr-1 h-4 w-4" /> New donation</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total} kg</div><div className="text-xs text-muted-foreground">Total donated</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.delivered} kg</div><div className="text-xs text-muted-foreground">Successfully delivered</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.active}</div><div className="text-xs text-muted-foreground">Active listings</div></CardContent></Card>
        </div>

        <div className="mt-8 space-y-4">
          {donations.isLoading && <p className="text-muted-foreground">Loading…</p>}
          {donations.data?.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              No donations yet. <Link to="/donate" className="font-semibold text-primary">Post your first one</Link>.
            </CardContent></Card>
          )}
          {donations.data?.map((d) => (
            <DonationCard
              key={d.id}
              donation={d}
              actions={
                <>
                  <Button size="sm" variant="outline" onClick={() => showMatches(d)}>
                    <Sparkles className="mr-1 h-3 w-3" /> NGO recommendations
                  </Button>
                  {d.status === "available" && (
                    <Button size="sm" variant="ghost" onClick={() => cancelDonation(d.id)}>
                      <Trash2 className="mr-1 h-3 w-3" /> Cancel
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      </main>

      <Dialog open={!!matches} onOpenChange={() => setMatches(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recommended NGOs for “{matches?.donation.title}”</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {matches?.list.map((m) => (
              <Card key={m.ngo.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.ngo.org_name ?? m.ngo.full_name}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      Match {m.score}%
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {m.reasons.map((r) => <li key={r}>• {r}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
