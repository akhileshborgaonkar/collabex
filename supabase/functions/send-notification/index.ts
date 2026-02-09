import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  recipientUserId: string;
  type: "collab_request" | "collab_accepted" | "collab_completed";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  senderName: string;
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

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      throw new Error("Database service not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { recipientUserId, type, title, message, data, senderName }: NotificationRequest = await req.json();

    console.log(`Creating notification for user ${recipientUserId}: ${type}`);

    // Get the recipient's email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipientUserId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Could not find recipient user");
    }

    const recipientEmail = userData.user.email;
    console.log(`Recipient email: ${recipientEmail}`);

    // Create in-app notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: recipientUserId,
        type,
        title,
        message,
        data: data || {},
        read: false,
      });

    if (notifError) {
      console.error("Error creating notification:", notifError);
      throw new Error("Failed to create notification");
    }

    console.log("In-app notification created successfully");

    // Send email notification
    const emailSubjects: Record<string, string> = {
      collab_request: `${senderName} wants to collaborate with you!`,
      collab_accepted: `${senderName} accepted your collaboration request!`,
      collab_completed: `Your collaboration with ${senderName} is complete!`,
    };

    const emailBodies: Record<string, string> = {
      collab_request: `
        <h2>New Collaboration Request</h2>
        <p><strong>${senderName}</strong> has sent you a collaboration request.</p>
        <p>${message}</p>
        <p>Log in to your account to accept or decline this request.</p>
      `,
      collab_accepted: `
        <h2>Collaboration Accepted!</h2>
        <p><strong>${senderName}</strong> has accepted your collaboration request.</p>
        <p>${message}</p>
        <p>You can now start working together. Good luck!</p>
      `,
      collab_completed: `
        <h2>Collaboration Completed</h2>
        <p>Your collaboration with <strong>${senderName}</strong> has been marked as complete.</p>
        <p>${message}</p>
        <p>Don't forget to leave a review for your collaborator!</p>
      `,
    };

    try {
      const emailResponse = await resend.emails.send({
        from: "CollabEx <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: emailSubjects[type] || title,
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
                ${emailBodies[type] || `<p>${message}</p>`}
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
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
