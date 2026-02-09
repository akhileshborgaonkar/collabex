import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface ShowInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  authorId: string;
  authorName: string;
  onSuccess: () => void;
}

export function ShowInterestDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
  authorId,
  authorName,
  onSuccess,
}: ShowInterestDialogProps) {
  const { profile } = useProfile();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!profile) {
      toast.error("Please log in to show interest");
      return;
    }

    setSubmitting(true);
    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from("collab_applications")
        .select("id")
        .eq("post_id", postId)
        .eq("applicant_id", profile.id)
        .maybeSingle();

      if (existing) {
        toast.error("You've already shown interest in this collaboration");
        onOpenChange(false);
        return;
      }

      const { error } = await supabase.from("collab_applications").insert({
        post_id: postId,
        applicant_id: profile.id,
        message: message.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      // Get author's user_id for notification
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", authorId)
        .single();

      if (authorProfile?.user_id) {
        await supabase.functions.invoke("send-notification", {
          body: {
            recipientUserId: authorProfile.user_id,
            type: "collab_interest",
            title: "Someone's Interested!",
            message: `${profile.display_name || "An influencer"} is interested in your collab: "${postTitle}"`,
            data: { postId, postTitle },
            senderName: profile.display_name || "A user",
          },
        });
      }

      toast.success("Interest submitted! The author will be notified.");
      setMessage("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Show Interest</DialogTitle>
          <DialogDescription>
            Let {authorName} know you're interested in "{postTitle}". Add an optional message to introduce yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="interest-message">Message (optional)</Label>
            <Textarea
              id="interest-message"
              placeholder="Tell them why you'd be a great fit for this collaboration..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Submitting...
              </>
            ) : (
              "Show Interest"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
