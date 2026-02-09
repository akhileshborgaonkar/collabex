import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BannerUploadProps {
  profileId: string;
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function BannerUpload({ profileId, currentUrl, onUpload, onRemove }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profileId}/banner.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portfolio")
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ banner_url: urlWithCacheBust })
        .eq("id", profileId);

      if (updateError) throw updateError;

      onUpload(urlWithCacheBust);
      toast({ title: "Success", description: "Banner image updated!" });
    } catch (err) {
      console.error("Banner upload error:", err);
      toast({ title: "Error", description: "Failed to upload banner", variant: "destructive" });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = async () => {
    try {
      await supabase
        .from("profiles")
        .update({ banner_url: "" })
        .eq("id", profileId);
      onRemove();
      toast({ title: "Success", description: "Banner removed" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to remove banner", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative h-32 rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
          currentUrl ? "border-transparent" : "border-border hover:border-primary/50"
        }`}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Profile banner"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change"}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-full w-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 mb-2" />
                <span className="text-sm">Upload Banner Image</span>
                <span className="text-xs">Recommended: 1200x300px</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
