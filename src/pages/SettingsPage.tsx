import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, LogOut, Building2, Users, Sparkles, Image, Link2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NicheSelector } from "@/components/profile/NicheSelector";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { BannerUpload } from "@/components/profile/BannerUpload";
import { SocialPlatformsManager } from "@/components/profile/SocialPlatformsManager";
import { PaymentSettings } from "@/components/settings/PaymentSettings";

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile, refetch } = useProfile();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Local state for avatar/banner URLs to update UI immediately
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

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
    setVideoUrl(profile.video_url || "");
    setAvatarUrl(profile.avatar_url || null);
    setBannerUrl(profile.banner_url || null);
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, any> = { 
      display_name: displayName, 
      bio, 
      location,
      video_url: videoUrl,
    };
    
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
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
          isBrand ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary"
        }`}>
          {isBrand ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
          {isBrand ? "Brand" : "Creator"}
        </span>
      </div>

      {/* Profile Picture & Banner */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Profile Media
            </CardTitle>
            <CardDescription>Upload your profile picture and banner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <AvatarUpload
                profileId={profile.id}
                currentUrl={avatarUrl}
                displayName={displayName || profile.display_name}
                onUpload={(url) => setAvatarUrl(url)}
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <BannerUpload
                profileId={profile.id}
                currentUrl={bannerUrl}
                onUpload={(url) => setBannerUrl(url)}
                onRemove={() => setBannerUrl(null)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Profile Info */}
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
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Intro Video URL
            </Label>
            <Input 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)} 
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              type="url"
            />
            <p className="text-xs text-muted-foreground">Add a YouTube or Vimeo link to showcase your work</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Save Changes</>}
          </Button>
        </CardContent>
      </Card>

      {/* Social Platforms */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Social Platforms
            </CardTitle>
            <CardDescription>Connect your social media accounts with clickable links</CardDescription>
          </CardHeader>
          <CardContent>
            <SocialPlatformsManager profileId={profile.id} />
          </CardContent>
        </Card>
      )}

      {/* Payment Settings - Only for creators/influencers */}
      {!isBrand && profile && (
        <PaymentSettings
          profileId={profile.id}
          initialBaseRate={(profile as any).base_rate}
          initialRateType={(profile as any).rate_type}
          initialCurrency={(profile as any).currency}
          initialOpenToFreeCollabs={(profile as any).open_to_free_collabs ?? false}
        />
      )}

      {/* Niche Selector - Only for creators/influencers */}
      {!isBrand && profile && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Content Niches
            </CardTitle>
            <CardDescription>Select your content niches. Changes are saved automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <NicheSelector profileId={profile.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="font-display">Account</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
