import { MapPin, Clock, Scale, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Donation = Database["public"]["Tables"]["donations"]["Row"];

const statusStyles: Record<string, string> = {
  available: "bg-primary/10 text-primary",
  accepted: "bg-chart-4/15 text-chart-4",
  picked_up: "bg-chart-3/20 text-chart-3",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function DonationCard({
  donation,
  actions,
}: {
  donation: Donation;
  actions?: React.ReactNode;
}) {
  const d = donation;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">{d.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{d.category}</Badge>
              <Badge variant="outline">{d.dietary_type}</Badge>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[d.status] ?? ""}`}>
                {d.status.replace("_", " ")}
              </span>
            </div>
          </div>
          {d.image_url && (
            <img src={d.image_url} alt={d.title} className="h-16 w-16 rounded-lg object-cover" />
          )}
        </div>
        {d.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {d.quantity_kg} kg · {d.servings} servings</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> pickup {formatDistanceToNow(new Date(d.pickup_deadline), { addSuffix: true })}</span>
          <span className="col-span-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.address}</span>
          {d.allergens && <span className="col-span-2 flex items-center gap-1"><Users className="h-3 w-3" /> Allergens: {d.allergens}</span>}
        </div>
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}
