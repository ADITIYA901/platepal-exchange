import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/donate")({
  head: () => ({ meta: [{ title: "Donate Food — FoodLoop" }] }),
  component: DonatePage,
});

const CATEGORIES = ["Cooked Meals", "Bakery", "Produce", "Dairy", "Packaged Foods", "Beverages", "Other"];
const DIETARY = ["Vegetarian", "Vegan", "Non-Vegetarian", "Contains Eggs"];

function DonatePage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Cooked Meals",
    quantity_kg: "5",
    servings: "10",
    dietary_type: "Vegetarian",
    allergens: "",
    storage_conditions: "",
    prepared_at: "",
    address: "",
    lat: "12.9716",
    lng: "77.5946",
    pickup_deadline: "",
  });
  const [image, setImage] = useState<File | null>(null);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (!form.title || !form.address || !form.pickup_deadline) {
      toast.error("Please fill in title, address and pickup deadline");
      return;
    }
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (image) {
        const path = `${userId}/${Date.now()}-${image.name}`;
        const { error: upErr } = await supabase.storage
          .from("donation-images")
          .upload(path, image);
        if (upErr) throw upErr;
        const { data } = await supabase.storage.from("donation-images").createSignedUrl(path, 60 * 60 * 24 * 30);
        image_url = data?.signedUrl ?? null;
      }

      const { error } = await supabase.from("donations").insert({
        donor_id: userId,
        title: form.title,
        description: form.description || null,
        category: form.category,
        quantity_kg: Number(form.quantity_kg),
        servings: Number(form.servings),
        dietary_type: form.dietary_type,
        allergens: form.allergens || null,
        storage_conditions: form.storage_conditions || null,
        prepared_at: form.prepared_at ? new Date(form.prepared_at).toISOString() : null,
        image_url,
        address: form.address,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        pickup_deadline: new Date(form.pickup_deadline).toISOString(),
      });
      if (error) throw error;
      toast.success("Donation posted! NGOs can now see it.");
      void navigate({ to: "/my-donations" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post donation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Post a food donation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Food name *</Label>
                <Input id="title" required value={form.title} onChange={set("title")} placeholder="e.g. Veg Biryani Trays" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={form.description} onChange={set("description")} placeholder="What's included, condition, packaging…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Dietary type</Label>
                  <Select value={form.dietary_type} onValueChange={(v) => setForm((f) => ({ ...f, dietary_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIETARY.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kg">Quantity (kg) *</Label>
                  <Input id="kg" type="number" min="0.5" step="0.5" required value={form.quantity_kg} onChange={set("quantity_kg")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serv">Estimated servings</Label>
                  <Input id="serv" type="number" min="1" value={form.servings} onChange={set("servings")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="allergens">Allergens</Label>
                  <Input id="allergens" value={form.allergens} onChange={set("allergens")} placeholder="e.g. Dairy, Nuts" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="storage">Storage conditions</Label>
                  <Input id="storage" value={form.storage_conditions} onChange={set("storage_conditions")} placeholder="e.g. Refrigerated" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prep">Prepared at</Label>
                  <Input id="prep" type="datetime-local" value={form.prepared_at} onChange={set("prepared_at")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deadline">Pickup deadline *</Label>
                  <Input id="deadline" type="datetime-local" required value={form.pickup_deadline} onChange={set("pickup_deadline")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Pickup address *</Label>
                <Input id="address" required value={form.address} onChange={set("address")} placeholder="Street, area, Bengaluru" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input id="lat" type="number" step="any" value={form.lat} onChange={set("lat")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input id="lng" type="number" step="any" value={form.lng} onChange={set("lng")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="image">Photo</Label>
                <Input id="image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post donation"}</Button>
                <Button type="button" variant="outline" asChild><Link to="/my-donations">Cancel</Link></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
