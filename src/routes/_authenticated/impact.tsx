import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({ meta: [{ title: "Impact Analytics — FoodLoop" }] }),
  component: ImpactPage,
});

const COLORS = ["#166534", "#22c55e", "#84cc16", "#0ea5e9", "#f97316", "#a855f7", "#64748b"];

function ImpactPage() {
  const donations = useQuery({
    queryKey: ["impact-donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*");
      return data ?? [];
    },
  });
  const counts = useQuery({
    queryKey: ["impact-counts"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("role");
      const all = roles ?? [];
      return {
        ngos: all.filter((r) => r.role === "ngo").length,
        volunteers: all.filter((r) => r.role === "volunteer").length,
        donors: all.filter((r) => r.role === "donor").length,
      };
    },
  });

  const all = donations.data ?? [];
  const totalKg = all.reduce((s, d) => s + Number(d.quantity_kg), 0);
  const delivered = all.filter((d) => d.status === "delivered");
  const deliveredKg = delivered.reduce((s, d) => s + Number(d.quantity_kg), 0);
  const meals = all.reduce((s, d) => s + d.servings, 0);
  const successRate = all.length ? Math.round((delivered.length / all.length) * 100) : 0;
  const co2Avoided = Math.round(deliveredKg * 2.5); // ~2.5 kg CO2e per kg food waste avoided (estimate)

  const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
  const monthly = months.map((m) => ({
    month: format(m, "MMM"),
    kg: all
      .filter((d) => startOfMonth(new Date(d.created_at)).getTime() === m.getTime())
      .reduce((s, d) => s + Number(d.quantity_kg), 0),
  }));

  const byCategory = Object.entries(
    all.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + Number(d.quantity_kg);
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Impact analytics</h1>
        <p className="text-muted-foreground">
          Calculated live from platform records. Environmental figures are estimates.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Food rescued", value: `${totalKg} kg` },
            { label: "Food delivered", value: `${deliveredKg} kg` },
            { label: "Estimated meals", value: `${meals}` },
            { label: "Delivery success rate", value: `${successRate}%` },
            { label: "Active NGOs", value: `${counts.data?.ngos ?? 0}` },
            { label: "Volunteers", value: `${counts.data?.volunteers ?? 0}` },
            { label: "Donors", value: `${counts.data?.donors ?? 0}` },
            { label: "Est. CO₂e avoided*", value: `${co2Avoided} kg` },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="font-display text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly donations (kg)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#166534" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Donations by category (kg)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          *CO₂e avoided uses an estimate of ~2.5 kg CO₂e per kilogram of food waste prevented.
        </p>
      </main>
    </div>
  );
}
