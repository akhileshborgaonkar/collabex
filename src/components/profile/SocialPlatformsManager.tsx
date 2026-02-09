import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, ExternalLink, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialPlatform {
  id: string;
  platform_name: string;
  handle: string;
  follower_count: number | null;
  url: string | null;
  is_verified: boolean;
}

interface SocialPlatformsManagerProps {
  profileId: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  youtube: "📺",
  twitter: "🐦",
  facebook: "👤",
  linkedin: "💼",
  twitch: "🎮",
  pinterest: "📌",
  snapchat: "👻",
};

export function SocialPlatformsManager({ profileId }: SocialPlatformsManagerProps) {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: "", handle: "", url: "", followers: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatforms();
  }, [profileId]);

  const fetchPlatforms = async () => {
    const { data } = await supabase
      .from("social_platforms")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });

    if (data) setPlatforms(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newPlatform.name || !newPlatform.handle) {
      toast({ title: "Error", description: "Platform name and handle are required", variant: "destructive" });
      return;
    }

    setSaving("new");

    try {
      const { data, error } = await supabase
        .from("social_platforms")
        .insert({
          profile_id: profileId,
          platform_name: newPlatform.name,
          handle: newPlatform.handle,
          url: newPlatform.url || null,
          follower_count: parseInt(newPlatform.followers) || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPlatforms([...platforms, data]);
      setNewPlatform({ name: "", handle: "", url: "", followers: "" });
      setShowAddForm(false);
      toast({ title: "Success", description: "Social platform added!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add platform", variant: "destructive" });
    }

    setSaving(null);
  };

  const handleRemove = async (id: string) => {
    setSaving(id);

    try {
      const { error } = await supabase
        .from("social_platforms")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPlatforms(platforms.filter((p) => p.id !== id));
      toast({ title: "Success", description: "Platform removed" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to remove platform", variant: "destructive" });
    }

    setSaving(null);
  };

  const handleUpdate = async (id: string, field: string, value: string | number) => {
    try {
      const { error } = await supabase
        .from("social_platforms")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      setPlatforms(platforms.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    } catch (err) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const getIcon = (name: string) => {
    const key = name.toLowerCase();
    return PLATFORM_ICONS[key] || "🔗";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platforms.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No social platforms added yet
        </p>
      )}

      {platforms.map((platform) => (
        <div
          key={platform.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
        >
          <span className="text-2xl">{getIcon(platform.platform_name)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{platform.platform_name}</span>
              {platform.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">@{platform.handle}</span>
              {platform.follower_count && (
                <span className="text-xs">• {platform.follower_count.toLocaleString()} followers</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {platform.url && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8"
              >
                <a href={platform.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(platform.id)}
              disabled={saving === platform.id}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              {saving === platform.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}

      {showAddForm ? (
        <div className="space-y-3 p-4 rounded-lg border border-dashed bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Input
                placeholder="e.g., Instagram"
                value={newPlatform.name}
                onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Handle</Label>
              <Input
                placeholder="@yourhandle"
                value={newPlatform.handle}
                onChange={(e) => setNewPlatform({ ...newPlatform, handle: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Profile URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={newPlatform.url}
                onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Followers (optional)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={newPlatform.followers}
                onChange={(e) => setNewPlatform({ ...newPlatform, followers: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving === "new"}
              className="gradient-primary text-primary-foreground"
            >
              {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Platform"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Social Platform
        </Button>
      )}
    </div>
  );
}
