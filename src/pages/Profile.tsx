import { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Star, ExternalLink, Handshake } from "lucide-react";
import { motion } from "framer-motion";
import { StartCollaborationDialog } from "@/components/collaborations/StartCollaborationDialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type FullProfile = Tables<"profiles"> & {
  profile_niches: { niche: string }[];
  social_platforms: Tables<"social_platforms">[];
  reviews: (Tables<"reviews"> & { profiles: { display_name: string } })[];
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { profile: currentUserProfile } = useProfile();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [collabDialogOpen, setCollabDialogOpen] = useState(false);
  const [existingCollab, setExistingCollab] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, profile_niches(niche), social_platforms(*), reviews!reviews_reviewee_id_fkey(*, profiles!reviews_reviewer_id_fkey(display_name))")
        .eq("id", id)
        .maybeSingle();
      setProfile(data as FullProfile | null);
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  // Check if there's an existing active collaboration with this profile
  useEffect(() => {
    if (!currentUserProfile?.id || !id || currentUserProfile.id === id) return;
    
    const checkExistingCollab = async () => {
      const { data } = await supabase
        .from("collaborations")
        .select("id")
        .or(`and(profile_a.eq.${currentUserProfile.id},profile_b.eq.${id}),and(profile_a.eq.${id},profile_b.eq.${currentUserProfile.id})`)
        .in("status", ["pending", "in_progress"])
        .limit(1);
      
      setExistingCollab((data?.length || 0) > 0);
    };
    checkExistingCollab();
  }, [currentUserProfile?.id, id]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Profile not found</div>;

  const isOwnProfile = currentUserProfile?.id === profile.id;
  const avgRating = profile.reviews.length > 0
    ? (profile.reviews.reduce((sum, r) => sum + r.rating, 0) / profile.reviews.length).toFixed(1)
    : null;

  const handleCollabSuccess = () => {
    setExistingCollab(true);
    toast.success("Collaboration request sent!");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Card className="overflow-hidden">
          <div 
            className="h-32 gradient-primary"
            style={profile.banner_url ? { 
              backgroundImage: `url(${profile.banner_url})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            } : undefined}
          />
          <CardContent className="relative pt-0 -mt-16 flex flex-col md:flex-row md:items-end gap-4 pb-6">
            <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-3xl font-display font-bold gradient-primary text-primary-foreground">
                {profile.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{profile.display_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-muted-foreground text-sm">
                {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
                <Badge variant="outline" className="capitalize">{profile.audience_tier} creator</Badge>
                {avgRating && <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />{avgRating}</span>}
              </div>
            </div>
            
            {/* Start Collaboration Button */}
            {!isOwnProfile && currentUserProfile && (
              <div className="mt-4 md:mt-0">
                {existingCollab ? (
                  <Badge variant="secondary" className="py-2 px-4">
                    <Handshake className="h-4 w-4 mr-2" />
                    Collaboration Active
                  </Badge>
                ) : (
                  <Button 
                    onClick={() => setCollabDialogOpen(true)}
                    className="gradient-primary text-primary-foreground"
                  >
                    <Handshake className="h-4 w-4 mr-2" />
                    Start Collaboration
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bio */}
        {profile.bio && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">About</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">{profile.bio}</p></CardContent>
          </Card>
        )}

        {/* Niches */}
        {profile.profile_niches.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Niches</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.profile_niches.map((pn) => (
                  <Badge key={pn.niche} className="gradient-primary text-primary-foreground border-transparent">{pn.niche}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social platforms */}
        {profile.social_platforms.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Platforms</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {profile.social_platforms.map((sp) => (
                <div key={sp.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sp.platform_name}</p>
                    <p className="text-sm text-muted-foreground">@{sp.handle} • {sp.follower_count?.toLocaleString()} followers</p>
                  </div>
                  {sp.url && <a href={sp.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" /></a>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        {profile.reviews.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Reviews ({profile.reviews.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {profile.reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">by {r.profiles?.display_name}</span>
                  </div>
                  {r.content && <p className="text-sm text-muted-foreground">{r.content}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Start Collaboration Dialog */}
      {currentUserProfile && profile && (
        <StartCollaborationDialog
          open={collabDialogOpen}
          onOpenChange={setCollabDialogOpen}
          currentProfileId={currentUserProfile.id}
          partnerProfileId={profile.id}
          partnerName={profile.display_name}
          onSuccess={handleCollabSuccess}
        />
      )}
    </div>
  );
}
