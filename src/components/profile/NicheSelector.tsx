import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NICHES = [
  "Fashion", "Tech", "Fitness", "Food", "Travel", "Gaming", 
  "Beauty", "Music", "Education", "Lifestyle", "Comedy", 
  "Photography", "Art", "Health", "Finance", "Sports", 
  "Parenting", "DIY"
];

interface NicheSelectorProps {
  profileId: string;
}

export function NicheSelector({ profileId }: NicheSelectorProps) {
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNiches = async () => {
      const { data } = await supabase
        .from("profile_niches")
        .select("niche")
        .eq("profile_id", profileId);
      
      if (data) {
        setSelectedNiches(data.map((n) => n.niche));
      }
      setLoading(false);
    };

    fetchNiches();
  }, [profileId]);

  const toggleNiche = async (niche: string) => {
    setSaving(niche);
    const isSelected = selectedNiches.includes(niche);

    try {
      if (isSelected) {
        // Remove niche
        const { error } = await supabase
          .from("profile_niches")
          .delete()
          .eq("profile_id", profileId)
          .eq("niche", niche);

        if (error) throw error;
        setSelectedNiches((prev) => prev.filter((n) => n !== niche));
      } else {
        // Add niche
        const { error } = await supabase
          .from("profile_niches")
          .insert({ profile_id: profileId, niche });

        if (error) throw error;
        setSelectedNiches((prev) => [...prev, niche]);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${isSelected ? "remove" : "add"} niche`,
        variant: "destructive",
      });
    }

    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {NICHES.map((niche) => {
        const isSelected = selectedNiches.includes(niche);
        const isSaving = saving === niche;

        return (
          <Badge
            key={niche}
            variant={isSelected ? "default" : "outline"}
            className={`cursor-pointer transition-all select-none ${
              isSelected 
                ? "gradient-primary text-primary-foreground border-transparent" 
                : "hover:border-primary"
            } ${isSaving ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => toggleNiche(niche)}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            {niche}
          </Badge>
        );
      })}
    </div>
  );
}
