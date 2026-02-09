import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRIES = [
  "Fashion & Apparel",
  "Beauty & Cosmetics", 
  "Technology",
  "Food & Beverage",
  "Health & Wellness",
  "Travel & Hospitality",
  "Gaming & Entertainment",
  "Sports & Fitness",
  "Finance & Banking",
  "Education",
  "Home & Living",
  "Automotive",
  "Sustainability",
  "Other",
];

export default function BrandOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <Navigate to="/auth" replace />;
  
  // Redirect non-brands to regular onboarding
  if (profile.account_type !== "brand") {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (profile.onboarding_completed) return <Navigate to="/" replace />;

  const handleFinish = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Required",
        description: "Please enter your company name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({
        display_name: companyName,
        company_name: companyName,
        bio,
        website_url: websiteUrl,
        industry,
        location,
        onboarding_completed: true,
      });
      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const steps = [
    // Step 0: Company Info
    <div key="company" className="space-y-4">
      <div className="space-y-2">
        <Label>Company Name *</Label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your brand or company name"
        />
      </div>
      <div className="space-y-2">
        <Label>About Your Brand</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell creators about your brand and what you're looking for..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
        />
      </div>
    </div>,

    // Step 1: Industry
    <div key="industry" className="space-y-4">
      <p className="text-sm text-muted-foreground">Select your industry</p>
      <div className="flex flex-wrap gap-2">
        {INDUSTRIES.map((ind) => (
          <Badge
            key={ind}
            variant={industry === ind ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
              industry === ind
                ? "gradient-primary text-primary-foreground border-transparent"
                : "hover:border-primary"
            }`}
            onClick={() => setIndustry(ind)}
          >
            {ind}
          </Badge>
        ))}
      </div>
    </div>,

    // Step 2: Website & Links
    <div key="website" className="space-y-4">
      <div className="space-y-2">
        <Label>Website URL</Label>
        <Input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://your-brand.com"
          type="url"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        You can add social media links and more details in your settings after onboarding.
      </p>
    </div>,
  ];

  const stepTitles = ["Company Details", "Industry", "Website"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="w-full max-w-lg relative">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {stepTitles.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="font-display">{stepTitles[step]}</CardTitle>
            <CardDescription>
              Step {step + 1} of {stepTitles.length}
            </CardDescription>
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
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="gradient-primary text-primary-foreground"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="gradient-primary text-primary-foreground"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Finish
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
