import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Building2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AccountTypeSelection() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<"influencer" | "brand" | null>(null);

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  
  // If account type is already set and onboarding not complete, go to appropriate onboarding
  if (profile?.account_type && !profile.onboarding_completed) {
    return <Navigate to={profile.account_type === "brand" ? "/brand-onboarding" : "/onboarding"} replace />;
  }
  
  // If onboarding is complete, go home
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  const handleContinue = async () => {
    if (!selectedType || !profile) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: selectedType })
        .eq("id", profile.id);

      if (error) throw error;
      
      // Navigate to appropriate onboarding based on account type
      navigate(selectedType === "brand" ? "/brand-onboarding" : "/onboarding");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save account type. Please try again.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const accountTypes = [
    {
      type: "influencer" as const,
      icon: Users,
      title: "Influencer / Creator",
      description: "I create content and want to collaborate with brands and other creators",
      features: ["Find collaboration partners", "Swipe to match with others", "Showcase your portfolio"],
    },
    {
      type: "brand" as const,
      icon: Building2,
      title: "Brand / Business",
      description: "I represent a brand looking to partner with influencers",
      features: ["Post collaboration opportunities", "Browse verified influencers", "Manage partnerships"],
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="w-full max-w-3xl relative space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold">Welcome to CollabEx</h1>
          <p className="text-muted-foreground">How would you like to use the platform?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accountTypes.map((account) => (
            <motion.div
              key={account.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all h-full ${
                  selectedType === account.type
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedType(account.type)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    selectedType === account.type ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <account.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-display">{account.title}</CardTitle>
                  <CardDescription>{account.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {account.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedType || submitting}
            className="gradient-primary text-primary-foreground min-w-[200px]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
