import { NavLink } from "react-router-dom";
import { Home, Search, Heart, Briefcase, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/discover", icon: Search, label: "Discover" },
  { to: "/match", icon: Heart, label: "Match" },
  { to: "/collabs", icon: Briefcase, label: "Collabs" },
  { to: "/messages", icon: MessageCircle, label: "Chat" },
];

export function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn("rounded-full p-1", isActive && "gradient-primary shadow-glow")}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "")} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
