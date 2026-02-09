import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation schema
interface NotificationRequest {
  recipientUserId: string;
  type: "collab_request" | "collab_accepted" | "collab_completed" | "collab_interest";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  senderName: string;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate notification request
function validateNotificationRequest(body: unknown): { valid: true; data: NotificationRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate recipientUserId
  if (typeof req.recipientUserId !== "string" || !UUID_REGEX.test(req.recipientUserId)) {
    return { valid: false, error: "Invalid recipientUserId - must be a valid UUID" };
  }

  // Validate type
  const validTypes = ["collab_request", "collab_accepted", "collab_completed", "collab_interest"];
  if (typeof req.type !== "string" || !validTypes.includes(req.type)) {
    return { valid: false, error: "Invalid type - must be collab_request, collab_accepted, collab_completed, or collab_interest" };
  }

  // Validate title
  if (typeof req.title !== "string" || req.title.length < 1 || req.title.length > 200) {
    return { valid: false, error: "Invalid title - must be 1-200 characters" };
  }

  // Validate message
  if (typeof req.message !== "string" || req.message.length < 1 || req.message.length > 1000) {
    return { valid: false, error: "Invalid message - must be 1-1000 characters" };
  }

  // Validate senderName
  if (typeof req.senderName !== "string" || req.senderName.length < 1 || req.senderName.length > 100) {
    return { valid: false, error: "Invalid senderName - must be 1-100 characters" };
  }

  // Validate optional data
  if (req.data !== undefined && (typeof req.data !== "object" || req.data === null)) {
    return { valid: false, error: "Invalid data - must be an object" };
  }

  return {
    valid: true,
    data: {
      recipientUserId: req.recipientUserId,
      type: req.type as NotificationRequest["type"],
      title: req.title,
      message: req.message,
      senderName: req.senderName,
      data: req.data as Record<string, unknown> | undefined,
    },
  };
}

// Escape HTML to prevent XSS in emails
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("Supabase credentials not configured");
      throw new Error("Database service not configured");
    }

    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authorization header" }),
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
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Validate input
    const body = await req.json();
    const validation = validateNotificationRequest(body);
    
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipientUserId, type, title, message, data, senderName } = validation.data;

    // Use service role client for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = new Resend(RESEND_API_KEY);

    // Get the sender's profile to verify they exist and are authorized
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (senderError || !senderProfile) {
      console.error("Sender profile not found:", senderError);
      return new Response(
        JSON.stringify({ error: "Sender profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the recipient's profile ID from their user_id
    const { data: recipientProfile, error: recipientError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("user_id", recipientUserId)
      .single();

    if (recipientError || !recipientProfile) {
      console.error("Recipient profile not found:", recipientError);
      return new Response(
        JSON.stringify({ error: "Recipient not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientProfileId = recipientProfile.id;
    console.log(`Sender profile: ${senderProfile.id}, Recipient profile: ${recipientProfileId}`);

    // Verify that sender has a valid relationship with recipient
    // Check for matches (uses profile IDs)
    const { data: relationship } = await supabase
      .from("matches")
      .select("id")
      .or(`and(profile_a.eq.${senderProfile.id},profile_b.eq.${recipientProfileId}),and(profile_a.eq.${recipientProfileId},profile_b.eq.${senderProfile.id})`)
      .limit(1);

    // Check for collaborations (uses profile IDs)
    const { data: collaboration } = await supabase
      .from("collaborations")
      .select("id")
      .or(`and(profile_a.eq.${senderProfile.id},profile_b.eq.${recipientProfileId}),and(profile_a.eq.${recipientProfileId},profile_b.eq.${senderProfile.id})`)
      .limit(1);

    // Check if sender has applied to recipient's collab post (for collab_interest notifications)
    const { data: collabApplication } = await supabase
      .from("collab_applications")
      .select("id, collab_posts!inner(author_id)")
      .eq("applicant_id", senderProfile.id)
      .limit(1);
    
    const hasApplicationToRecipient = collabApplication && collabApplication.some(
      (app: { collab_posts: { author_id: string } }) => app.collab_posts.author_id === recipientProfileId
    );

    // Check if recipient owns a collab post that sender can apply to
    const { data: recipientPosts } = await supabase
      .from("collab_posts")
      .select("id")
      .eq("author_id", recipientProfileId)
      .limit(1);
    
    const recipientHasCollabPost = recipientPosts && recipientPosts.length > 0;

    const hasRelationship = 
      (relationship && relationship.length > 0) || 
      (collaboration && collaboration.length > 0) ||
      hasApplicationToRecipient ||
      (type === "collab_interest" && recipientHasCollabPost);
    
    if (!hasRelationship) {
      console.error("No valid relationship between sender and recipient");
      console.error(`Checks: match=${relationship?.length}, collab=${collaboration?.length}, app=${hasApplicationToRecipient}, post=${recipientHasCollabPost}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized - no relationship with recipient" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating notification for user ${recipientUserId}: ${type}`);

    // Get the recipient's email from auth.users (recipientUserId is already the user_id)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipientUserId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Could not find recipient user");
    }

    const recipientEmail = userData.user.email;
    console.log(`Recipient email: ${recipientEmail}`);

    // Sanitize user input for HTML email
    const safeSenderName = escapeHtml(senderName);
    const safeMessage = escapeHtml(message);
    const safeTitle = escapeHtml(title);

    // Create in-app notification (recipientUserId is already the user_id)
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: recipientUserId,
        type,
        title: safeTitle,
        message: safeMessage,
        data: data || {},
        read: false,
      });

    if (notifError) {
      console.error("Error creating notification:", notifError);
      throw new Error("Failed to create notification");
    }

    console.log("In-app notification created successfully");

    // Send email notification with sanitized content
    const emailSubjects: Record<string, string> = {
      collab_request: `${safeSenderName} wants to collaborate with you!`,
      collab_accepted: `${safeSenderName} accepted your collaboration request!`,
      collab_completed: `Your collaboration with ${safeSenderName} is complete!`,
      collab_interest: `${safeSenderName} is interested in your collaboration!`,
    };

    const emailBodies: Record<string, string> = {
      collab_request: `
        <h2>New Collaboration Request</h2>
        <p><strong>${safeSenderName}</strong> has sent you a collaboration request.</p>
        <p>${safeMessage}</p>
        <p>Log in to your account to accept or decline this request.</p>
      `,
      collab_accepted: `
        <h2>Collaboration Accepted!</h2>
        <p><strong>${safeSenderName}</strong> has accepted your collaboration request.</p>
        <p>${safeMessage}</p>
        <p>You can now start working together. Good luck!</p>
      `,
      collab_completed: `
        <h2>Collaboration Completed</h2>
        <p>Your collaboration with <strong>${safeSenderName}</strong> has been marked as complete.</p>
        <p>${safeMessage}</p>
        <p>Don't forget to leave a review for your collaborator!</p>
      `,
      collab_interest: `
        <h2>Someone's Interested!</h2>
        <p><strong>${safeSenderName}</strong> has shown interest in your collaboration opportunity.</p>
        <p>${safeMessage}</p>
        <p>Log in to view their profile and start a collaboration!</p>
      `,
    };

    try {
      const emailResponse = await resend.emails.send({
        from: "CollabEx <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: emailSubjects[type] || safeTitle,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">CollabEx</h1>
              </div>
              <div class="content">
                ${emailBodies[type] || `<p>${safeMessage}</p>`}
              </div>
              <div class="footer">
                <p>This is an automated notification from CollabEx.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Email sent successfully:", emailResponse);
    } catch (emailError) {
      // Log email error but don't fail the whole request - in-app notification was created
      console.error("Error sending email (non-fatal):", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
