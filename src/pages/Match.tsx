import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Heart, MapPin, Loader2, Sparkles, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tables } from "@/integrations/supabase/types";

type ProfileWithNiches = Tables<"profiles"> & { 
  profile_niches: { niche: string }[];
  social_platforms: { is_verified: boolean; platform_name: string }[];
};

export default function Match() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<ProfileWithNiches[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const fetchCandidates = async () => {
      // Get already-swiped IDs
      const { data: swipedData } = await supabase
        .from("swipe_actions")
        .select("swiped_id")
        .eq("swiper_id", profile.id);
      const swipedIds = (swipedData || []).map((s) => s.swiped_id);

      let query = supabase
        .from("profiles")
        .select("*, profile_niches(niche), social_platforms(is_verified, platform_name)")
        .eq("onboarding_completed", true)
        .eq("account_type", "influencer") // Only show influencers in matching
        .neq("user_id", user.id)
        .limit(20);

      if (swipedIds.length > 0) {
        query = query.not("id", "in", `(${swipedIds.join(",")})`);
      }

      const { data } = await query;
      setCandidates((data as ProfileWithNiches[]) || []);
      setLoading(false);
    };
    fetchCandidates();
  }, [user, profile]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  
  // Brands don't have access to match/swipe - redirect to discover
  if (profile?.account_type === "brand") return <Navigate to="/discover" replace />;

  const currentCandidate = candidates[currentIndex];

  const handleSwipe = async (direction: "left" | "right") => {
    if (!profile || !currentCandidate || swiping) return;
    setSwiping(true);

    const { error } = await supabase.from("swipe_actions").insert({
      swiper_id: profile.id,
      swiped_id: currentCandidate.id,
      direction,
    });

    if (!error && direction === "right") {
      // Check if it's a match
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`and(profile_a.eq.${profile.id},profile_b.eq.${currentCandidate.id}),and(profile_a.eq.${currentCandidate.id},profile_b.eq.${profile.id})`)
        .maybeSingle();

      if (match) {
        toast({
          title: "🎉 It's a Match!",
          description: `You and ${currentCandidate.display_name} matched! Start chatting now.`,
        });
      }
    }

    setCurrentIndex((i) => i + 1);
    setSwiping(false);
  };

  const getVerifiedPlatforms = (platforms: { is_verified: boolean; platform_name: string }[]) => {
    return platforms.filter((p) => p.is_verified);
  };

  const SwipeCard = ({ candidate }: { candidate: ProfileWithNiches }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const passOpacity = useTransform(x, [-100, 0], [1, 0]);
    const verifiedPlatforms = getVerifiedPlatforms(candidate.social_platforms || []);
    const hasVerifiedPlatform = verifiedPlatforms.length > 0;

    return (
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) handleSwipe("right");
          else if (info.offset.x < -100) handleSwipe("left");
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        <Card className="h-full shadow-xl border-border/50 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Avatar area */}
            <div className="relative h-48 md:h-64 gradient-primary flex items-center justify-center">
              <div className="relative">
                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-card">
                  <AvatarImage src={candidate.avatar_url || ""} />
                  <AvatarFallback className="text-4xl font-display font-bold bg-card text-foreground">
                    {candidate.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {hasVerifiedPlatform && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute -bottom-1 -right-1 bg-card text-primary rounded-full p-1 shadow-lg">
                        <BadgeCheck className="h-6 w-6" />
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
              {/* Swipe indicators */}
              <motion.div style={{ opacity: likeOpacity }} className="absolute top-4 right-4 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white rotate-12">
                LIKE
              </motion.div>
              <motion.div style={{ opacity: passOpacity }} className="absolute top-4 left-4 rounded-full bg-destructive px-4 py-2 text-sm font-bold text-white -rotate-12">
                PASS
              </motion.div>
            </div>

            <div className="flex-1 p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">{candidate.display_name}</h2>
                  {hasVerifiedPlatform && (
                    <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                {candidate.location && (
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />{candidate.location}
                  </div>
                )}
              </div>
              {candidate.bio && <p className="text-muted-foreground">{candidate.bio}</p>}
              <div className="flex flex-wrap gap-2">
                {candidate.profile_niches.map((pn) => (
                  <Badge key={pn.niche} variant="secondary">{pn.niche}</Badge>
                ))}
                <Badge variant="outline" className="capitalize">{candidate.audience_tier}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <TooltipProvider>
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold mb-6 text-center">Find Your Match</h1>

        <div className="relative h-[500px] md:h-[550px]">
          {loading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !currentCandidate ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">No more profiles</h2>
              <p className="text-muted-foreground">Check back later for new creators!</p>
            </div>
          ) : (
            <AnimatePresence>
              <SwipeCard key={currentCandidate.id} candidate={currentCandidate} />
            </AnimatePresence>
          )}
        </div>

        {currentCandidate && (
          <div className="flex justify-center gap-6 mt-6">
            <Button
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleSwipe("left")}
              disabled={swiping}
            >
              <X className="h-7 w-7" />
            </Button>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full gradient-primary text-primary-foreground shadow-glow"
              onClick={() => handleSwipe("right")}
              disabled={swiping}
            >
              <Heart className="h-7 w-7" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
