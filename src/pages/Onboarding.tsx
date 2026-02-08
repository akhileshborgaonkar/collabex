import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowRight, ArrowLeft, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const NICHES = ["Fashion", "Tech", "Fitness", "Food", "Travel", "Gaming", "Beauty", "Music", "Education", "Lifestyle", "Comedy", "Photography", "Art", "Health", "Finance", "Sports", "Parenting", "DIY"];
const TIERS = [
  { value: "nano", label: "Nano", desc: "1K–10K" },
  { value: "micro", label: "Micro", desc: "10K–50K" },
  { value: "mid", label: "Mid", desc: "50K–500K" },
  { value: "macro", label: "Macro", desc: "500K–1M" },
  { value: "mega", label: "Mega", desc: "1M+" },
];

type Platform = { name: string; handle: string; followers: string };

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [tier, setTier] = useState("nano");
  const [platforms, setPlatforms] = useState<Platform[]>([{ name: "", handle: "", followers: "" }]);

  if (authLoading || profileLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  const toggleNiche = (n: string) => {
    setSelectedNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
  };

  const addPlatform = () => setPlatforms([...platforms, { name: "", handle: "", followers: "" }]);
  const removePlatform = (i: number) => setPlatforms(platforms.filter((_, idx) => idx !== i));
  const updatePlatformField = (i: number, field: keyof Platform, val: string) => {
    const copy = [...platforms];
    copy[i] = { ...copy[i], [field]: val };
    setPlatforms(copy);
  };

  const handleFinish = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      await updateProfile({
        display_name: displayName || profile.display_name,
        bio,
        location,
        audience_tier: tier,
        onboarding_completed: true,
      });

      // Insert niches
      if (selectedNiches.length > 0) {
        await supabase.from("profile_niches").insert(
          selectedNiches.map((niche) => ({ profile_id: profile.id, niche }))
        );
      }

      // Insert platforms
      const validPlatforms = platforms.filter((p) => p.name && p.handle);
      if (validPlatforms.length > 0) {
        await supabase.from("social_platforms").insert(
          validPlatforms.map((p) => ({
            profile_id: profile.id,
            platform_name: p.name,
            handle: p.handle,
            follower_count: parseInt(p.followers) || 0,
          }))
        );
      }

      navigate("/");
    } catch (err) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const steps = [
    // Step 0: Basic info
    <div key="basic" className="space-y-4">
      <div className="space-y-2">
        <Label>Display Name</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your creator name" />
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
      </div>
    </div>,

    // Step 1: Niches
    <div key="niches" className="space-y-4">
      <p className="text-sm text-muted-foreground">Select your content niches (choose at least 1)</p>
      <div className="flex flex-wrap gap-2">
        {NICHES.map((n) => (
          <Badge
            key={n}
            variant={selectedNiches.includes(n) ? "default" : "outline"}
            className={`cursor-pointer transition-all ${selectedNiches.includes(n) ? "gradient-primary text-primary-foreground border-transparent" : "hover:border-primary"}`}
            onClick={() => toggleNiche(n)}
          >
            {n}
          </Badge>
        ))}
      </div>
    </div>,

    // Step 2: Audience tier
    <div key="tier" className="space-y-4">
      <p className="text-sm text-muted-foreground">What's your total audience size?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTier(t.value)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${tier === t.value ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"}`}
          >
            <p className="font-display font-semibold">{t.label}</p>
            <p className="text-sm text-muted-foreground">{t.desc} followers</p>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Social platforms
    <div key="platforms" className="space-y-4">
      <p className="text-sm text-muted-foreground">Add your social media platforms</p>
      {platforms.map((p, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Platform (e.g. Instagram)" value={p.name} onChange={(e) => updatePlatformField(i, "name", e.target.value)} />
            <Input placeholder="@handle" value={p.handle} onChange={(e) => updatePlatformField(i, "handle", e.target.value)} />
            <Input placeholder="Followers" type="number" value={p.followers} onChange={(e) => updatePlatformField(i, "followers", e.target.value)} />
          </div>
          {platforms.length > 1 && (
            <Button variant="ghost" size="icon" onClick={() => removePlatform(i)}><X className="h-4 w-4" /></Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPlatform}><Plus className="h-4 w-4 mr-1" />Add Platform</Button>
    </div>,
  ];

  const stepTitles = ["About You", "Your Niches", "Audience Size", "Social Platforms"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full gradient-primary opacity-10 blur-3xl" />
      </div>
      <div className="w-full max-w-lg relative">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {stepTitles.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "gradient-primary" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="font-display">{stepTitles[step]}</CardTitle>
            <CardDescription>Step {step + 1} of {stepTitles.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4 mr-1" />Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="gradient-primary text-primary-foreground">
                  Next<ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={submitting} className="gradient-primary text-primary-foreground">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Finish</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
