import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Thermometer, Clock, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/food-safety")({
  head: () => ({
    meta: [
      { title: "Food Safety — FoodLoop" },
      { name: "description", content: "FoodLoop's food safety guidelines for donors, NGOs and volunteers." },
      { property: "og:title", content: "Food Safety — FoodLoop" },
      { property: "og:description", content: "FoodLoop's food safety guidelines for donors, NGOs and volunteers." },
    ],
  }),
  component: FoodSafetyPage,
});

const sections = [
  {
    icon: Clock,
    title: "Time and freshness",
    items: [
      "Every donation records its preparation time where relevant.",
      "Pickup deadlines ensure food is collected while still safe to eat.",
      "Perishable cooked food must be consumed within the window stated by the donor.",
    ],
  },
  {
    icon: Thermometer,
    title: "Storage and transport",
    items: [
      "Donors declare storage conditions (refrigerated, cool, room temperature) on every listing.",
      "Volunteers transport food in clean, closed containers.",
      "Cold-chain items are prioritised for the fastest pickups.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Allergens and labelling",
    items: [
      "Allergen information is required on every donation.",
      "Dietary type (vegan, vegetarian, non-vegetarian) is always shown.",
      "NGOs verify condition and labelling at pickup before accepting.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Trust and verification",
    items: [
      "NGOs are verified by platform administrators before receiving food.",
      "Safety reports and complaints are reviewed by administrators.",
      "Every donation has a full status timeline from posting to delivery.",
    ],
  },
];

function FoodSafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="text-center font-display text-4xl font-bold">Food safety at FoodLoop</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Rescued food must be safe food. These guidelines govern every donation on the platform.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardContent className="p-6">
                <s.icon className="h-7 w-7 text-primary" />
                <h2 className="mt-3 font-display text-lg font-semibold">{s.title}</h2>
                <ul className="mt-3 space-y-2">
                  {s.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
