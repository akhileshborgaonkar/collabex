import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CollaborationCard } from "./CollaborationCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CollaborationStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface CollaborationRow {
  id: string;
  profile_a: string;
  profile_b: string;
  status: string;
  title: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Collaboration {
  id: string;
  profile_a: string;
  profile_b: string;
  status: CollaborationStatus;
  title: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
  partner: Profile;
}

interface Review {
  reviewee_id: string;
}

interface CollaborationsListProps {
  profileId: string;
}

export function CollaborationsList({ profileId }: CollaborationsListProps) {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollaborations = async () => {
    try {
      // Fetch all collaborations where user is involved
      const { data: collabData, error: collabError } = await supabase
        .from("collaborations")
        .select("*")
        .or(`profile_a.eq.${profileId},profile_b.eq.${profileId}`)
        .order("created_at", { ascending: false });

      if (collabError) throw collabError;

      // Get unique partner IDs
      const partnerIds = (collabData || []).map((c: CollaborationRow) =>
        c.profile_a === profileId ? c.profile_b : c.profile_a
      );

      // Fetch partner profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", partnerIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map((p: Profile) => [p.id, p])
      );

      // Map collaborations with partner data
      const mapped: Collaboration[] = (collabData || []).map((c: CollaborationRow) => {
        const partnerId = c.profile_a === profileId ? c.profile_b : c.profile_a;
        return {
          ...c,
          status: c.status as CollaborationStatus,
          partner: profilesMap.get(partnerId) || {
            id: partnerId,
            display_name: "Unknown",
            avatar_url: null,
          },
        };
      });

      setCollaborations(mapped);

      // Fetch reviews I've left
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("reviewee_id")
        .eq("reviewer_id", profileId);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchCollaborations();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCollabs = collaborations.filter(
    (c) => c.status === "pending" || c.status === "in_progress"
  );
  const completedCollabs = collaborations.filter((c) => c.status === "completed");
  const cancelledCollabs = collaborations.filter((c) => c.status === "cancelled");

  const getReviewForPartner = (partnerId: string) =>
    reviews.find((r) => r.reviewee_id === partnerId);

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="active">Active ({activeCollabs.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completedCollabs.length})</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled ({cancelledCollabs.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4 mt-4">
        {activeCollabs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active collaborations</p>
        ) : (
          activeCollabs.map((collab) => (
            <CollaborationCard
              key={collab.id}
              collaboration={collab}
              currentProfileId={profileId}
              onUpdate={fetchCollaborations}
              existingReview={getReviewForPartner(collab.partner.id)}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4 mt-4">
        {completedCollabs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No completed collaborations yet</p>
        ) : (
          completedCollabs.map((collab) => (
            <CollaborationCard
              key={collab.id}
              collaboration={collab}
              currentProfileId={profileId}
              onUpdate={fetchCollaborations}
              existingReview={getReviewForPartner(collab.partner.id)}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="cancelled" className="space-y-4 mt-4">
        {cancelledCollabs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No cancelled collaborations</p>
        ) : (
          cancelledCollabs.map((collab) => (
            <CollaborationCard
              key={collab.id}
              collaboration={collab}
              currentProfileId={profileId}
              onUpdate={fetchCollaborations}
              existingReview={getReviewForPartner(collab.partner.id)}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
