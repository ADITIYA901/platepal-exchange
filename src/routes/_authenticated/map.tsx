import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { DonationMap } from "@/components/donation-map";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({ meta: [{ title: "Donation Map — FoodLoop" }] }),
  component: MapPage,
});

function MapPage() {
  const donations = useQuery({
    queryKey: ["map-donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").not("lat", "is", null);
      return data ?? [];
    },
  });
  const ngos = useQuery({
    queryKey: ["map-ngos"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "ngo");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("*").in("id", ids);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Donation map</h1>
        <p className="text-muted-foreground">
          Donation pickup points and NGO locations around Bengaluru (demonstration data; not live GPS tracking).
        </p>
        <div className="mt-6">
          <DonationMap donations={donations.data ?? []} ngos={ngos.data ?? []} height="560px" />
        </div>
      </main>
    </div>
  );
}
