import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { distanceKm } from "@/lib/matching";
import { SiteHeader } from "@/components/site-header";
import { DonationCard } from "@/components/donation-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Available Donations — FoodLoop" }] }),
  component: BrowsePage,
});

function BrowsePage() {
  const { userId, role, profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const isNgo = role === "ngo";

  const available = useQuery({
    queryKey: ["available-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("status", "available")
        .order("pickup_deadline", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const accepted = useQuery({
    queryKey: ["ngo-accepted", userId],
    enabled: isNgo && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("accepted_by", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return (available.data ?? []).filter(
      (d) =>
        (category === "all" || d.category === category) &&
        d.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [available.data, category, search]);

  async function accept(id: string) {
    if (!userId) return;
    // Conditional update: only succeeds if still available — prevents double claims.
    const { data, error } = await supabase
      .from("donations")
      .update({ status: "accepted", accepted_by: userId })
      .eq("id", id)
      .eq("status", "available")
      .select();
    if (error) {
      toast.error(error.message);
      return;
    }
    const donation = data?.[0];
    if (!donation) {
      toast.error("Another NGO already claimed this donation.");
      void queryClient.invalidateQueries({ queryKey: ["available-donations"] });
      return;
    }
    await supabase.from("pickup_tasks").insert({ donation_id: id, ngo_id: userId });
    await supabase.from("notifications").insert({
      user_id: donation.donor_id,
      title: "Donation accepted",
      body: `${profile?.org_name ?? "An NGO"} accepted “${donation.title}”. A volunteer will be assigned.`,
    });
    toast.success("Donation accepted — a pickup task was created for volunteers.");
    void queryClient.invalidateQueries();
  }

  const totalReceived = (accepted.data ?? [])
    .filter((d) => d.status === "delivered")
    .reduce((s, d) => s + Number(d.quantity_kg), 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">
          {isNgo ? "NGO dashboard" : "Available donations"}
        </h1>
        {isNgo && profile && (
          <p className="text-muted-foreground">
            {profile.org_name} · capacity {profile.capacity_kg ?? 0} kg ·{" "}
            {profile.verified ? "Verified" : "Verification pending"}
          </p>
        )}

        {isNgo && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-4"><div className="text-2xl font-bold">{accepted.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">Donations accepted</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold">{totalReceived} kg</div><div className="text-xs text-muted-foreground">Food received</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold">{available.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">Open donations nearby</div></CardContent></Card>
          </div>
        )}

        <Tabs defaultValue="available" className="mt-8">
          <TabsList>
            <TabsTrigger value="available">Available</TabsTrigger>
            {isNgo && <TabsTrigger value="accepted">Accepted by us</TabsTrigger>}
          </TabsList>

          <TabsContent value="available" className="mt-4">
            <div className="mb-4 flex flex-wrap gap-3">
              <Input placeholder="Search food…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {["Cooked Meals", "Bakery", "Produce", "Dairy", "Packaged Foods", "Beverages", "Other"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {available.isLoading && <p className="text-muted-foreground">Loading…</p>}
              {filtered.length === 0 && !available.isLoading && (
                <p className="text-muted-foreground">No donations match your filters.</p>
              )}
              {filtered.map((d) => {
                const dist =
                  profile?.lat != null && profile?.lng != null && d.lat != null && d.lng != null
                    ? distanceKm(profile.lat, profile.lng, d.lat, d.lng)
                    : null;
                return (
                  <DonationCard
                    key={d.id}
                    donation={d}
                    actions={
                      <>
                        {dist != null && <span className="self-center text-xs text-muted-foreground">{dist.toFixed(1)} km from you</span>}
                        {isNgo ? (
                          <Button size="sm" onClick={() => accept(d.id)}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Accept donation
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Only NGOs can accept donations.</span>
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>
          </TabsContent>

          {isNgo && (
            <TabsContent value="accepted" className="mt-4 space-y-4">
              {accepted.data?.length === 0 && <p className="text-muted-foreground">Nothing accepted yet.</p>}
              {accepted.data?.map((d) => <DonationCard key={d.id} donation={d} />)}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
