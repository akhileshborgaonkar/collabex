import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Validate verify request
function validateVerifyRequest(body: unknown): { valid: true; data: VerifyRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate platformId
  if (typeof req.platformId !== "string" || !UUID_REGEX.test(req.platformId)) {
    return { valid: false, error: "Invalid platformId - must be a valid UUID" };
  }

  // Validate platformName
  if (typeof req.platformName !== "string" || req.platformName.length < 1 || req.platformName.length > 50) {
    return { valid: false, error: "Invalid platformName - must be 1-50 characters" };
  }

  // Validate handle (optional but if provided, must be valid)
  const handle = typeof req.handle === "string" ? req.handle : "";
  if (handle.length > 100) {
    return { valid: false, error: "Invalid handle - must be max 100 characters" };
  }

  // Validate url (optional but if provided, must be valid)
  const url = typeof req.url === "string" ? req.url : "";
  if (url.length > 500) {
    return { valid: false, error: "Invalid url - must be max 500 characters" };
  }

  if (url && !url.startsWith("https://") && !url.startsWith("http://")) {
    return { valid: false, error: "Invalid url - must start with http:// or https://" };
  }

  return {
    valid: true,
    data: {
      platformId: req.platformId,
      platformName: req.platformName,
      handle,
      url,
    },
  };
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
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Database service not configured");
    }

    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, verified: false, error: "Unauthorized - missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to verify identity
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, verified: false, error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Validate input
    const body = await req.json();
    const validation = validateVerifyRequest(body);
    
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, verified: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { platformId, platformName, handle, url } = validation.data;

    // Use service role client for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the platform belongs to the authenticated user
    const { data: platform, error: platformError } = await supabase
      .from("social_platforms")
      .select("profile_id, profiles!inner(user_id)")
      .eq("id", platformId)
      .single();

    if (platformError || !platform) {
      console.error("Platform not found:", platformError);
      return new Response(
        JSON.stringify({ success: false, verified: false, error: "Platform not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the platform belongs to the authenticated user
    const profileUserId = (platform.profiles as { user_id: string }).user_id;
    if (profileUserId !== user.id) {
      console.error("User does not own this platform");
      return new Response(
        JSON.stringify({ success: false, verified: false, error: "Unauthorized - not your platform" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying platform: ${platformName}, handle: ${handle}, url: ${url}`);

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
      JSON.stringify({ success: false, verified: false, error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
