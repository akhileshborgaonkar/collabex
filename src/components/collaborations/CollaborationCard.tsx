import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, PlayCircle, Star, MessageSquare, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReviewDialog } from "./ReviewDialog";
import { useProfile } from "@/hooks/useProfile";

type CollaborationStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
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

interface CollaborationCardProps {
  collaboration: Collaboration;
  currentProfileId: string;
  onUpdate: () => void;
  existingReview?: { reviewee_id: string } | null;
}

const statusConfig: Record<CollaborationStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending Approval", icon: Clock, variant: "secondary" },
  in_progress: { label: "In Progress", icon: PlayCircle, variant: "default" },
  completed: { label: "Completed", icon: CheckCircle, variant: "outline" },
  cancelled: { label: "Declined", icon: XCircle, variant: "destructive" },
};

export function CollaborationCard({ collaboration, currentProfileId, onUpdate, existingReview }: CollaborationCardProps) {
  const { profile } = useProfile();
  const [updating, setUpdating] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const config = statusConfig[collaboration.status];
  const StatusIcon = config.icon;
  const hasReviewedPartner = existingReview?.reviewee_id === collaboration.partner.id;
  
  // Check if current user is the one who received the request (profile_b)
  const isRecipient = collaboration.profile_b === currentProfileId;
  const isRequester = collaboration.profile_a === currentProfileId;

  const sendNotification = async (
    recipientProfileId: string,
    type: "collab_accepted" | "collab_completed",
    title: string,
    message: string
  ) => {
    try {
      // Get recipient's user_id
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", recipientProfileId)
        .single();

      if (recipientProfile?.user_id) {
        await supabase.functions.invoke("send-notification", {
          body: {
            recipientUserId: recipientProfile.user_id,
            type,
            title,
            message,
            data: { collaborationTitle: collaboration.title, collaborationId: collaboration.id },
            senderName: profile?.display_name || "A user",
          },
        });
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const updateStatus = async (newStatus: CollaborationStatus) => {
    setUpdating(true);
    try {
      const updates: { status: CollaborationStatus; completed_at?: string | null } = { status: newStatus };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from("collaborations")
        .update(updates)
        .eq("id", collaboration.id);

      if (error) throw error;

      // Send notifications based on status change
      if (newStatus === "in_progress") {
        // Notify the requester that their request was accepted
        await sendNotification(
          collaboration.profile_a,
          "collab_accepted",
          "Collaboration Accepted!",
          `${profile?.display_name || "Your partner"} accepted your collaboration request for "${collaboration.title}"`
        );
      } else if (newStatus === "completed") {
        // Notify the partner that collaboration is complete
        await sendNotification(
          collaboration.partner.id,
          "collab_completed",
          "Collaboration Completed",
          `Your collaboration "${collaboration.title}" has been marked as complete. Don't forget to leave a review!`
        );
      }
      
      const statusMessages: Record<CollaborationStatus, string> = {
        pending: "Status updated",
        in_progress: "Collaboration accepted! Work has begun.",
        completed: "Collaboration marked as completed!",
        cancelled: "Collaboration declined",
      };
      
      toast.success(statusMessages[newStatus]);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={collaboration.partner.avatar_url || undefined} />
                <AvatarFallback>{collaboration.partner.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{collaboration.title || "Untitled Collaboration"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isRequester ? "Request to" : "Request from"} {collaboration.partner.display_name}
                </p>
              </div>
            </div>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {collaboration.description && (
            <p className="text-sm text-muted-foreground">{collaboration.description}</p>
          )}
          
          <div className="text-xs text-muted-foreground">
            Started {format(new Date(collaboration.created_at), "MMM d, yyyy")}
            {collaboration.completed_at && (
              <> • Completed {format(new Date(collaboration.completed_at), "MMM d, yyyy")}</>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {/* Pending state - recipient can accept/decline, requester can only cancel */}
            {collaboration.status === "pending" && isRecipient && (
              <>
                <Button size="sm" onClick={() => updateStatus("in_progress")} disabled={updating}>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus("cancelled")} disabled={updating}>
                  <UserX className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
            {collaboration.status === "pending" && isRequester && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting response
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => updateStatus("cancelled")} disabled={updating}>
                  Cancel Request
                </Button>
              </div>
            )}
            
            {/* In progress - either party can mark complete */}
            {collaboration.status === "in_progress" && (
              <Button size="sm" onClick={() => updateStatus("completed")} disabled={updating}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
            
            {/* Completed - can leave review if not already done */}
            {collaboration.status === "completed" && !hasReviewedPartner && (
              <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
                <Star className="h-4 w-4 mr-1" />
                Leave Review
              </Button>
            )}
            {collaboration.status === "completed" && hasReviewedPartner && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                Review Submitted
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        reviewerId={currentProfileId}
        revieweeId={collaboration.partner.id}
        revieweeName={collaboration.partner.display_name}
        onSuccess={onUpdate}
      />
    </>
  );
}
