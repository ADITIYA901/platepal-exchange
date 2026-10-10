import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageCheck, Sparkles, Truck, HandHeart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — FoodLoop" },
      { name: "description", content: "From surplus food to shared meals: the FoodLoop donation workflow explained." },
      { property: "og:title", content: "How It Works — FoodLoop" },
      { property: "og:description", content: "From surplus food to shared meals: the FoodLoop donation workflow explained." },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    icon: PackageCheck,
    title: "1. Donor posts surplus food",
    text: "Restaurants, hotels, supermarkets and households create a donation with food name, category, quantity, dietary type, allergens, storage conditions, photos, pickup location and deadline.",
  },
  {
    icon: Sparkles,
    title: "2. Smart NGO matching",
    text: "FoodLoop scores nearby NGOs on distance, receiving capacity, food compatibility and urgency, and recommends the best matches with an explanation for each score.",
  },
  {
    icon: Truck,
    title: "3. NGO accepts, volunteer collects",
    text: "An NGO accepts the donation — exclusive donations can only be claimed once — and assigns a volunteer, who sees pickup and delivery locations on the map.",
  },
  {
    icon: HandHeart,
    title: "4. Delivery confirmed, impact counted",
    text: "The volunteer updates status at each step. Once delivery is confirmed, impact statistics update: kilograms rescued, meals provided and waste avoided.",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-center font-display text-4xl font-bold">How FoodLoop works</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          A complete, tracked workflow from surplus food to shared meals.
        </p>
        <div className="mt-12 space-y-6">
          {steps.map((s) => (
            <Card key={s.title}>
              <CardContent className="flex gap-5 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "register" }}>Join FoodLoop</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
