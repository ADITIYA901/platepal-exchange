import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Donation = Database["public"]["Tables"]["donations"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  donations?: Donation[];
  ngos?: Profile[];
  height?: string;
}

/**
 * Leaflet map (OpenStreetMap tiles) centred on Bengaluru.
 * Loaded client-side only — Leaflet needs the browser.
 */
export function DonationMap({ donations = [], ngos = [], height = "500px" }: Props) {
  const [Map, setMap] = useState<React.ComponentType<Props> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([RL, L]) => {
      if (cancelled) return;
      // Fix default marker icons (bundler-safe)
      const icon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      function Inner({ donations: ds = [], ngos: ns = [], height: h = "500px" }: Props) {
        return (
          <RL.MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            style={{ height: h, width: "100%", borderRadius: "0.75rem" }}
          >
            <RL.TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {ds
              .filter((d) => d.lat != null && d.lng != null)
              .map((d) => (
                <RL.Marker key={d.id} position={[d.lat!, d.lng!]} icon={icon}>
                  <RL.Popup>
                    <strong>{d.title}</strong>
                    <br />
                    {d.quantity_kg} kg · {d.status}
                    <br />
                    {d.address}
                  </RL.Popup>
                </RL.Marker>
              ))}
            {ns
              .filter((n) => n.lat != null && n.lng != null)
              .map((n) => (
                <RL.CircleMarker
                  key={n.id}
                  center={[n.lat!, n.lng!]}
                  radius={10}
                  pathOptions={{ color: "#166534", fillColor: "#22c55e", fillOpacity: 0.7 }}
                >
                  <RL.Popup>
                    <strong>{n.org_name ?? n.full_name}</strong>
                    <br />
                    NGO · capacity {n.capacity_kg ?? 0} kg
                  </RL.Popup>
                </RL.CircleMarker>
              ))}
          </RL.MapContainer>
        );
      }
      setMap(() => Inner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Map) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }
  return <Map donations={donations} ngos={ngos} height={height} />;
}
