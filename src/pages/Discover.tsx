import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin, Users, Loader2, BadgeCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tables } from "@/integrations/supabase/types";

const NICHES = ["Fashion", "Tech", "Fitness", "Food", "Travel", "Gaming", "Beauty", "Music", "Education", "Lifestyle"];

type ProfileWithNiches = Tables<"profiles"> & { 
  profile_niches: { niche: string }[];
  social_platforms: { is_verified: boolean; platform_name: string }[];
};

export default function Discover() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profiles, setProfiles] = useState<ProfileWithNiches[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, profile_niches(niche), social_platforms(is_verified, platform_name)")
        .eq("onboarding_completed", true)
        .neq("user_id", user.id)
        .limit(50);
      setProfiles((data as ProfileWithNiches[]) || []);
      setLoading(false);
    };
    fetchProfiles();
  }, [user]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const filtered = profiles.filter((p) => {
    const matchesSearch = !search || p.display_name.toLowerCase().includes(search.toLowerCase()) || (p.bio || "").toLowerCase().includes(search.toLowerCase());
    const matchesNiche = nicheFilter.length === 0 || p.profile_niches.some((pn) => nicheFilter.includes(pn.niche));
    return matchesSearch && matchesNiche;
  });

  const toggleNiche = (n: string) => setNicheFilter((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const getVerifiedPlatforms = (platforms: { is_verified: boolean; platform_name: string }[]) => {
    return platforms.filter((p) => p.is_verified);
  };

  const FilterPanel = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-semibold mb-2">Niches</h3>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <Badge
              key={n}
              variant={nicheFilter.includes(n) ? "default" : "outline"}
              className={`cursor-pointer ${nicheFilter.includes(n) ? "gradient-primary text-primary-foreground border-transparent" : ""}`}
              onClick={() => toggleNiche(n)}
            >
              {n}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Discover Creators</h1>
      </div>

      {/* Search & filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search creators..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="py-4"><FilterPanel /></div>
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="outline" size="icon" onClick={() => {}}>
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop: side filter */}
      <div className="flex gap-8">
        {!isMobile && nicheFilter.length > 0 && (
          <div className="w-48 shrink-0">
            <FilterPanel />
          </div>
        )}

        {/* Profile grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-display text-lg">No creators found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p, i) => {
                  const verifiedPlatforms = getVerifiedPlatforms(p.social_platforms || []);
                  const hasVerifiedPlatform = verifiedPlatforms.length > 0;
                  
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card
                        className="hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => navigate(`/profile/${p.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={p.avatar_url || ""} />
                                <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                                  {p.display_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {hasVerifiedPlatform && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                      <BadgeCheck className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Verified on {verifiedPlatforms.map(p => p.platform_name).join(", ")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-display font-semibold truncate group-hover:text-primary transition-colors">{p.display_name}</p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {p.location && <><MapPin className="h-3 w-3" /><span className="truncate">{p.location}</span></>}
                              </div>
                            </div>
                          </div>
                          {p.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.bio}</p>}
                          <div className="flex flex-wrap gap-1">
                            {p.profile_niches.slice(0, 3).map((pn) => (
                              <Badge key={pn.niche} variant="secondary" className="text-xs">{pn.niche}</Badge>
                            ))}
                            <Badge variant="outline" className="text-xs capitalize">{p.audience_tier}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
