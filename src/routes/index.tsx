import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, HandHeart, Leaf, MapPin, PackageCheck, ShieldCheck, Sparkles, Truck, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodLoop — Save Food. Share Hope." },
      {
        name: "description",
        content:
          "FoodLoop connects food donors with NGOs and volunteers to rescue surplus food and feed communities across Bengaluru.",
      },
      { property: "og:title", content: "FoodLoop — Save Food. Share Hope." },
      {
        property: "og:description",
        content: "Rescue surplus food and redistribute it to people in need.",
      },
    ],
  }),
  component: HomePage,
});

function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data: donations } = await supabase
        .from("donations")
        .select("quantity_kg, servings, status, created_at");
      const { data: profiles } = await supabase.from("profiles").select("id, org_name, verified");
      const all = donations ?? [];
      const delivered = all.filter((d) => d.status === "delivered");
      return {
        totalKg: all.reduce((s, d) => s + Number(d.quantity_kg), 0),
        deliveredKg: delivered.reduce((s, d) => s + Number(d.quantity_kg), 0),
        meals: all.reduce((s, d) => s + d.servings, 0),
        ngos: (profiles ?? []).filter((p) => p.org_name && p.verified).length,
        active: all.filter((d) => d.status === "available").length,
      };
    },
  });
}

function useFeaturedDonations() {
  return useQuery({
    queryKey: ["featured-donations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });
}

function HomePage() {
  const stats = usePlatformStats();
  const featured = useFeaturedDonations();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary via-background to-accent/40" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" /> Smart food rescue platform
            </Badge>
            <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Save Food.
              <br />
              <span className="text-primary">Share Hope.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              FoodLoop connects restaurants, hotels, supermarkets and households with NGOs and
              volunteers who collect surplus food and deliver it to people in need.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" search={{ mode: "register" }}>
                  Donate Food <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/browse">Find Donations</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: PackageCheck, label: "Food rescued", value: `${stats.data?.totalKg ?? 0} kg` },
              { icon: HandHeart, label: "Meals provided*", value: `${stats.data?.meals ?? 0}` },
              { icon: Users, label: "Partner NGOs", value: `${stats.data?.ngos ?? 0}` },
              { icon: Truck, label: "Active donations", value: `${stats.data?.active ?? 0}` },
            ].map((s) => (
              <Card key={s.label} className="transition-transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <s.icon className="h-6 w-6 text-primary" />
                  <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured donations */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Featured donations</h2>
            <p className="mt-1 text-muted-foreground">Fresh surplus food available right now.</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/browse">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(featured.data ?? []).map((d) => (
            <Card key={d.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="flex h-36 items-center justify-center bg-secondary">
                <Leaf className="h-10 w-10 text-primary/50" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{d.category}</Badge>
                  <span className="text-xs text-muted-foreground">{d.quantity_kg} kg</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{d.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {d.address}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center font-display text-3xl font-bold">How FoodLoop works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { icon: PackageCheck, title: "Donor posts food", text: "Restaurants and households list surplus food with pickup details." },
              { icon: Sparkles, title: "Smart matching", text: "Our algorithm recommends the best NGOs by distance, capacity and urgency." },
              { icon: Truck, title: "Volunteer collects", text: "A verified volunteer picks up the donation and delivers it to the NGO." },
              { icon: HandHeart, title: "Impact tracked", text: "Every kilogram rescued is counted toward meals provided and waste avoided." },
            ].map((s, i) => (
              <Card key={s.title}>
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {i + 1}
                  </div>
                  <s.icon className="mt-4 h-6 w-6 text-primary" />
                  <h3 className="mt-2 font-display font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/how-it-works">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <ShieldCheck className="h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-3xl font-bold">Food safety first</h2>
            <p className="mt-3 text-muted-foreground">
              Every donation lists preparation time, storage conditions and allergens. NGOs verify
              quality at pickup, and administrators review safety reports across the platform.
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <Link to="/food-safety">Read our safety guidelines</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="space-y-4 p-6">
              {[
                "Preparation time and expiry tracked on every listing",
                "Allergen and storage labels required",
                "NGO verification by platform administrators",
                "Pickup confirmation with status timeline",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center font-display text-3xl font-bold">What our community says</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { quote: "FoodLoop turned our daily surplus into hundreds of meals for families nearby.", name: "Ananya R.", role: "Restaurant Owner" },
              { quote: "The smart matching means we get donations we can actually use, right when we need them.", name: "Hope Foundation", role: "Partner NGO" },
              { quote: "Pickup tasks are clear and the map makes every delivery simple.", name: "Vikram S.", role: "Volunteer" },
            ].map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <p className="text-sm italic text-muted-foreground">“{t.quote}”</p>
                  <div className="mt-4 text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="font-display text-4xl font-bold">Ready to rescue food?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Join donors, NGOs and volunteers making Bengaluru a zero-food-waste city.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "register" }}>Get started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/about">About us</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">*Meal estimates are calculated from platform records.</p>
      </section>

      <SiteFooter />
    </div>
  );
}
