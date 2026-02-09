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

async function verifyUrl(url: string): Promise<{ exists: boolean; statusCode?: number }> {
  try {
    console.log(`Verifying URL: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    console.log(`URL ${url} returned status: ${response.status}`);
    
    // Consume the body to prevent resource leak
    await response.text();
    
    // Consider 200-299 and some 3xx as valid
    return { exists: response.status >= 200 && response.status < 400, statusCode: response.status };
  } catch (error) {
    console.error(`Error verifying URL ${url}:`, error);
    return { exists: false };
  }
}

async function verifyPlatform(
  platformName: string,
  handle: string,
  url: string
): Promise<VerificationResult> {
  const platformKey = platformName.toLowerCase();
  const config = platformConfigs[platformKey];

  // Validate URL format
  if (url) {
    // Check if URL matches expected platform pattern
    if (config && !config.urlPattern.test(url)) {
      return {
        valid: false,
        error: `Invalid ${platformName} URL format`,
      };
    }

    // Verify URL exists
    const { exists, statusCode } = await verifyUrl(url);
    
    if (!exists) {
      return {
        valid: false,
        error: statusCode 
          ? `Profile not found (status: ${statusCode})` 
          : "Could not reach the profile URL",
      };
    }

    // URL is valid
    return {
      valid: true,
      displayName: handle,
    };
  }

  // If no URL provided, build one from handle
  if (config && handle) {
    const profileUrl = config.buildProfileUrl(handle);
    const { exists, statusCode } = await verifyUrl(profileUrl);
    
    if (!exists) {
      return {
        valid: false,
        error: statusCode 
          ? `Profile not found (status: ${statusCode})` 
          : "Could not verify the handle",
      };
    }

    return {
      valid: true,
      displayName: handle,
    };
  }

  return {
    valid: false,
    error: "Please provide a valid profile URL",
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
