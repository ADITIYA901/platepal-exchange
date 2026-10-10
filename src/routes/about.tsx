import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FoodLoop" },
      { name: "description", content: "FoodLoop's mission to end food waste and hunger in our cities." },
      { property: "og:title", content: "About — FoodLoop" },
      { property: "og:description", content: "FoodLoop's mission to end food waste and hunger in our cities." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">About FoodLoop</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Every day, restaurants, hotels, supermarkets and homes throw away food that is still
          perfectly good — while millions go hungry. FoodLoop closes that gap.
        </p>
        <p className="mt-4 text-muted-foreground">
          We are a smart food rescue and redistribution platform. Donors list surplus food in
          seconds, our matching algorithm recommends the best-suited NGOs by distance, capacity and
          urgency, and verified volunteers handle pickup and delivery. Every step is tracked, and
          every kilogram rescued is counted toward our collective impact.
        </p>
        <h2 className="mt-10 font-display text-2xl font-bold">Our mission</h2>
        <p className="mt-3 text-muted-foreground">
          A city where no good food is wasted while anyone goes hungry. We start in Bengaluru and
          grow from there.
        </p>
        <h2 className="mt-10 font-display text-2xl font-bold">Demonstration notice</h2>
        <p className="mt-3 text-muted-foreground">
          FoodLoop is a demonstration platform. Locations shown are around Bengaluru, India, and
          impact figures are estimates derived from platform records, clearly labelled as such.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
