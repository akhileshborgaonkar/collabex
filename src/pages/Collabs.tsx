import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Calendar, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type CollabPost = Tables<"collab_posts"> & { profiles: { display_name: string; avatar_url: string | null } };

export default function Collabs() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CollabPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [niche, setNiche] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("collab_posts")
      .select("*, profiles!collab_posts_author_id_fkey(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data as CollabPost[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleCreate = async () => {
    if (!profile || !title.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("collab_posts").insert({
      author_id: profile.id,
      title: title.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      niche: niche.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Posted!", description: "Your collab opportunity is live." });
      setTitle(""); setDescription(""); setRequirements(""); setNiche("");
      setDialogOpen(false);
      fetchPosts();
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => {
    if (s === "open") return "gradient-primary text-primary-foreground border-transparent";
    if (s === "in_progress") return "bg-accent text-accent-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Collaboration Board</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Post Collab</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Collaboration</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Collab title" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's the collab about?" rows={3} /></div>
              <div className="space-y-2"><Label>Requirements</Label><Input value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="e.g. 10K+ followers, Fashion niche" /></div>
              <div className="space-y-2"><Label>Niche</Label><Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Fashion, Tech" /></div>
              <Button onClick={handleCreate} disabled={submitting || !title.trim()} className="w-full gradient-primary text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Collaboration"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-display text-lg">No collaborations yet</p>
          <p className="text-sm">Be the first to post an opportunity!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg line-clamp-1">{post.title}</CardTitle>
                    <Badge className={statusColor(post.status)}>{post.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">by {post.profiles?.display_name || "Unknown"}</p>
                </CardHeader>
                <CardContent>
                  {post.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {post.niche && <Badge variant="secondary">{post.niche}</Badge>}
                    {post.deadline && (
                      <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{new Date(post.deadline).toLocaleDateString()}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
