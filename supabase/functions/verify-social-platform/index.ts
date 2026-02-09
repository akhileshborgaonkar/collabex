import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  platformId: string;
  platformName: string;
  handle: string;
  url: string;
}

interface VerificationResult {
  valid: boolean;
  displayName?: string;
  avatarUrl?: string;
  followerCount?: number;
  bio?: string;
  error?: string;
}

// Platform-specific URL patterns and verification
const platformConfigs: Record<string, {
  urlPattern: RegExp;
  buildProfileUrl: (handle: string) => string;
  extractHandle: (url: string) => string | null;
}> = {
  instagram: {
    urlPattern: /(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/,
    buildProfileUrl: (handle) => `https://www.instagram.com/${handle}/`,
    extractHandle: (url) => {
      const match = url.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
  },
  tiktok: {
    urlPattern: /tiktok\.com\/@([a-zA-Z0-9_.]+)/,
    buildProfileUrl: (handle) => `https://www.tiktok.com/@${handle.replace('@', '')}`,
    extractHandle: (url) => {
      const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
  },
  youtube: {
    urlPattern: /youtube\.com\/(?:@|channel\/|c\/|user\/)([a-zA-Z0-9_-]+)/,
    buildProfileUrl: (handle) => `https://www.youtube.com/@${handle.replace('@', '')}`,
    extractHandle: (url) => {
      const match = url.match(/youtube\.com\/(?:@|channel\/|c\/|user\/)([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    },
  },
  twitter: {
    urlPattern: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/,
    buildProfileUrl: (handle) => `https://x.com/${handle.replace('@', '')}`,
    extractHandle: (url) => {
      const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
  },
  linkedin: {
    urlPattern: /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/,
    buildProfileUrl: (handle) => `https://www.linkedin.com/in/${handle}`,
    extractHandle: (url) => {
      const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    },
  },
  facebook: {
    urlPattern: /facebook\.com\/([a-zA-Z0-9_.]+)/,
    buildProfileUrl: (handle) => `https://www.facebook.com/${handle}`,
    extractHandle: (url) => {
      const match = url.match(/facebook\.com\/([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    },
  },
  twitch: {
    urlPattern: /twitch\.tv\/([a-zA-Z0-9_]+)/,
    buildProfileUrl: (handle) => `https://www.twitch.tv/${handle}`,
    extractHandle: (url) => {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
  },
  pinterest: {
    urlPattern: /pinterest\.com\/([a-zA-Z0-9_]+)/,
    buildProfileUrl: (handle) => `https://www.pinterest.com/${handle}`,
    extractHandle: (url) => {
      const match = url.match(/pinterest\.com\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
  },
};

// Validate URL format and structure (without making HTTP requests to avoid rate limiting)
function validateUrlFormat(url: string, platformKey: string): { valid: boolean; error?: string } {
  const config = platformConfigs[platformKey];
  
  if (!config) {
    // For unknown platforms, just check if it's a valid URL
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
  }
  
  // Check if URL matches the expected platform pattern
  if (!config.urlPattern.test(url)) {
    return { valid: false, error: `Invalid ${platformKey} URL format. Please provide a valid profile URL.` };
  }
  
  // Extract handle to ensure it's not empty
  const handle = config.extractHandle(url);
  if (!handle || handle.length < 1) {
    return { valid: false, error: "Could not extract username from URL" };
  }
  
  // Validate handle doesn't contain suspicious patterns
  const suspiciousPatterns = [
    /^(login|signin|signup|register|admin|settings|explore|reels|stories|about|help|support|privacy|terms)$/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(handle))) {
    return { valid: false, error: "This appears to be a system page, not a user profile" };
  }
  
  return { valid: true };
}

async function verifyPlatform(
  platformName: string,
  handle: string,
  url: string
): Promise<VerificationResult> {
  const platformKey = platformName.toLowerCase();

  // If URL is provided, validate its format
  if (url) {
    const urlValidation = validateUrlFormat(url, platformKey);
    
    if (!urlValidation.valid) {
      return {
        valid: false,
        error: urlValidation.error,
      };
    }

    // URL format is valid - mark as verified
    // Note: We're using format validation because social platforms 
    // block automated verification attempts (429 rate limiting)
    console.log(`URL format validated for ${platformName}: ${url}`);
    
    return {
      valid: true,
      displayName: handle,
    };
  }

  // If no URL but handle is provided, construct and validate the URL
  const config = platformConfigs[platformKey];
  if (config && handle) {
    const profileUrl = config.buildProfileUrl(handle.replace('@', ''));
    const urlValidation = validateUrlFormat(profileUrl, platformKey);
    
    if (!urlValidation.valid) {
      return {
        valid: false,
        error: urlValidation.error,
      };
    }

    return {
      valid: true,
      displayName: handle,
    };
  }

  return {
    valid: false,
    error: "Please provide a valid profile URL or handle",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Database service not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { platformId, platformName, handle, url }: VerifyRequest = await req.json();

    console.log(`Verifying platform: ${platformName}, handle: ${handle}, url: ${url}`);

    if (!platformId || !platformName) {
      throw new Error("Missing required fields: platformId, platformName");
    }

    // Verify the social platform
    const result = await verifyPlatform(platformName, handle, url);

    console.log(`Verification result:`, result);

    // Update the social_platforms record
    if (result.valid) {
      const { error: updateError } = await supabase
        .from("social_platforms")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", platformId);

      if (updateError) {
        console.error("Error updating verification status:", updateError);
        throw new Error("Failed to update verification status");
      }

      console.log(`Platform ${platformId} marked as verified`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: result.valid,
        ...result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in verify-social-platform:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, verified: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
