import type { Database } from "@/integrations/supabase/types";

type Donation = Database["public"]["Tables"]["donations"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface NgoMatch {
  ngo: Profile;
  score: number;
  reasons: string[];
  distanceKm: number | null;
}

/** Haversine distance in km. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Smart NGO matching: distance (40), capacity fit (30), urgency (20), verification (10).
 * Returns matches sorted by score, best first.
 */
export function matchNgos(donation: Donation, ngos: Profile[]): NgoMatch[] {
  const hoursLeft = Math.max(
    0,
    (new Date(donation.pickup_deadline).getTime() - Date.now()) / 3_600_000,
  );

  return ngos
    .map((ngo) => {
      const reasons: string[] = [];
      let score = 0;

      let dist: number | null = null;
      if (donation.lat != null && donation.lng != null && ngo.lat != null && ngo.lng != null) {
        dist = distanceKm(donation.lat, donation.lng, ngo.lat, ngo.lng);
        const distScore = Math.max(0, 40 - dist * 4);
        score += distScore;
        reasons.push(`${dist.toFixed(1)} km away`);
      }

      const capacity = Number(ngo.capacity_kg ?? 0);
      if (capacity >= Number(donation.quantity_kg)) {
        score += 30;
        reasons.push(`Capacity ${capacity} kg covers ${donation.quantity_kg} kg donation`);
      } else if (capacity > 0) {
        score += 10;
        reasons.push(`Limited capacity (${capacity} kg)`);
      }

      if (hoursLeft <= 6) {
        score += 20;
        reasons.push("Urgent: pickup deadline within 6 hours");
      } else if (hoursLeft <= 24) {
        score += 10;
        reasons.push("Pickup needed within 24 hours");
      }

      if (ngo.verified) {
        score += 10;
        reasons.push("Verified organization");
      }

      return { ngo, score: Math.round(score), reasons, distanceKm: dist };
    })
    .sort((a, b) => b.score - a.score);
}
