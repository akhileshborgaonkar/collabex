import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Sparkles, Users, Briefcase, TrendingUp, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  
  const [matchesCount, setMatchesCount] = useState(0);
  const [activeCollabsCount, setActiveCollabsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setStatsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch matches count
        const { count: matchCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .or(`profile_a.eq.${profile.id},profile_b.eq.${profile.id}`);

        // Fetch active collaborations count (pending + in_progress)
        const { count: collabCount } = await supabase
          .from("collaborations")
          .select("*", { count: "exact", head: true })
          .or(`profile_a.eq.${profile.id},profile_b.eq.${profile.id}`)
          .in("status", ["pending", "in_progress"]);

        // Fetch unread messages count
        const { count: messageCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", profile.id)
          .eq("read", false);

        setMatchesCount(matchCount || 0);
        setActiveCollabsCount(collabCount || 0);
        setUnreadMessagesCount(messageCount || 0);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [profile?.id]);

  if (authLoading || profileLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  const stats = [
    { icon: Users, label: "Matches", value: statsLoading ? "..." : matchesCount.toString(), color: "text-primary" },
    { icon: Briefcase, label: "Active Collabs", value: statsLoading ? "..." : activeCollabsCount.toString(), color: "text-secondary" },
    { icon: TrendingUp, label: "Profile Views", value: "—", color: "text-accent" },
    { icon: MessageCircle, label: "Messages", value: statsLoading ? "..." : unreadMessagesCount.toString(), color: "text-primary" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Welcome back, <span className="gradient-text">{profile?.display_name || "Creator"}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your creator network</p>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-primary/20 shadow-glow overflow-hidden">
          <CardHeader className="gradient-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="font-display text-lg">Recommended For You</CardTitle>
            </div>
            <p className="text-sm opacity-90">AI-powered match suggestions based on your profile</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Complete your profile and start swiping to get personalized recommendations</p>
              <Button onClick={() => navigate("/discover")} className="gradient-primary text-primary-foreground">
                Start Discovering
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
                <Icon className={`h-6 w-6 ${color}`} />
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/discover")}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl gradient-primary p-3">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold">Browse Creators</p>
              <p className="text-sm text-muted-foreground">Find your next collaborator</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/match")}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl gradient-accent p-3">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold">Start Matching</p>
              <p className="text-sm text-muted-foreground">Swipe to find your match</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/collabs")}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl gradient-warm p-3">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold">Collab Board</p>
              <p className="text-sm text-muted-foreground">Post or find collabs</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
