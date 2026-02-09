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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface StartCollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfileId: string;
  partnerProfileId: string;
  partnerName: string;
  onSuccess: () => void;
}

export function StartCollaborationDialog({
  open,
  onOpenChange,
  currentProfileId,
  partnerProfileId,
  partnerName,
  onSuccess,
}: StartCollaborationDialogProps) {
  const { profile } = useProfile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("collaborations").insert({
        profile_a: currentProfileId,
        profile_b: partnerProfileId,
        title: title.trim(),
        description: description.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      // Get partner's user_id for notification
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", partnerProfileId)
        .single();

      if (partnerProfile?.user_id) {
        // Send notification to partner
        await supabase.functions.invoke("send-notification", {
          body: {
            recipientUserId: partnerProfile.user_id,
            type: "collab_request",
            title: "New Collaboration Request",
            message: `${profile?.display_name || "Someone"} wants to collaborate on "${title.trim()}"`,
            data: { collaborationTitle: title.trim() },
            senderName: profile?.display_name || "A user",
          },
        });
      }

      toast.success("Collaboration request sent!");
      setTitle("");
      setDescription("");
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
          <DialogTitle>Start Collaboration</DialogTitle>
          <DialogDescription>
            Begin a new collaboration with {partnerName}. You can track progress and leave reviews after completion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collab-title">Title</Label>
            <Input
              id="collab-title"
              placeholder="e.g., Instagram Reel Campaign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collab-description">Description (optional)</Label>
            <Textarea
              id="collab-description"
              placeholder="Brief description of the collaboration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? "Creating..." : "Start Collaboration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
