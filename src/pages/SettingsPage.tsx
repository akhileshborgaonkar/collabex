import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, LogOut, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (authLoading || profileLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const isBrand = profile?.account_type === "brand";

  if (profile && !initialized) {
    setDisplayName(profile.display_name || "");
    setBio(profile.bio || "");
    setLocation(profile.location || "");
    setCompanyName(profile.company_name || "");
    setWebsiteUrl(profile.website_url || "");
    setIndustry(profile.industry || "");
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, any> = { display_name: displayName, bio, location };
    
    if (isBrand) {
      updates.company_name = companyName;
      updates.website_url = websiteUrl;
      updates.industry = industry;
    }
    
    const { error } = await updateProfile(updates) || {};
    if (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully." });
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
          isBrand ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary"
        }`}>
          {isBrand ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
          {isBrand ? "Brand" : "Creator"}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Edit Profile</CardTitle>
          <CardDescription>Update your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBrand ? (
            <>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Fashion & Apparel" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-brand.com" type="url" />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
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
