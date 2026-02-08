import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Heart, Briefcase, MessageCircle, Settings, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/discover", icon: Search, label: "Discover" },
  { to: "/match", icon: Heart, label: "Match" },
  { to: "/collabs", icon: Briefcase, label: "Collabs" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function DesktopSidebar() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 p-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="font-display text-xl font-bold gradient-text">CollabEx</span>
          <p className="text-xs text-muted-foreground">Where Influence Meets Impact.</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-4">
        <button
          onClick={() => navigate(`/profile/${profile?.id}`)}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
              {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{profile?.display_name || "Your Profile"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.audience_tier || "nano"} creator</p>
          </div>
        </button>
        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
