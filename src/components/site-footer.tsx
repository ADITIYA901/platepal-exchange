import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold">FoodLoop</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Smart food rescue and redistribution. Save food, share hope.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
            <li><Link to="/food-safety" className="hover:text-foreground">Food Safety</Link></li>
            <li><Link to="/map" className="hover:text-foreground">Donation Map</Link></li>
            <li><Link to="/impact" className="hover:text-foreground">Impact Analytics</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Get Involved</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-foreground">Donate Food</Link></li>
            <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-foreground">Partner as NGO</Link></li>
            <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-foreground">Volunteer</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">About</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">Our Mission</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign In</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        FoodLoop — demonstration platform. Impact figures are estimates based on platform records.
      </div>
    </footer>
  );
}
