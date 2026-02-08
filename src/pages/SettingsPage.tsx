import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (authLoading || profileLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  if (profile && !initialized) {
    setDisplayName(profile.display_name || "");
    setBio(profile.bio || "");
    setLocation(profile.location || "");
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ display_name: displayName, bio, location }) || {};
    if (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully." });
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="font-display">Edit Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Display Name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></div>
          <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Save Changes</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Account</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
