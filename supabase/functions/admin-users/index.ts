import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing authorization header", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller identity
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !caller) {
      return errorResponse("Invalid or expired token: " + (authError?.message || "no user"), 401);
    }

    // Check caller is admin
    const { data: callerProfile } = await adminClient
      .from("user_profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const { email, password, name, role, company_name, access_level, skills, max_daily_bookings, location_lat, location_lng, timezone, language, notifications_enabled } = body;

        if (!email || !password || !name || !role) {
          return errorResponse("Missing required fields: email, password, name, role");
        }

        // Create auth user — the on_auth_user_created trigger automatically
        // inserts a row into user_profiles using user_metadata fields.
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role, company_name: company_name || undefined },
        });

        if (createError || !authData?.user) {
          return errorResponse(createError?.message || "Failed to create auth user", 500);
        }

        // Update the trigger-created profile with additional fields
        const { error: updateError } = await adminClient
          .from("user_profiles")
          .update({
            access_level: access_level || null,
            skills: skills || null,
            max_daily_bookings: max_daily_bookings || null,
            location_lat: location_lat || null,
            location_lng: location_lng || null,
            timezone: timezone || "UTC",
            language: language || "en",
            notifications_enabled: notifications_enabled ?? true,
          })
          .eq("id", authData.user.id);

        if (updateError) {
          console.error("Failed to update extra profile fields:", updateError.message);
        }

        return jsonResponse({ user: { id: authData.user.id, email, name, role } }, 201);
      }

      case "delete": {
        const { userId } = body;
        if (!userId) {
          return errorResponse("Missing required field: userId");
        }
        if (userId === caller.id) {
          return errorResponse("Cannot delete your own account", 400);
        }

        const { error: delProfileError } = await adminClient
          .from("user_profiles")
          .delete()
          .eq("id", userId);
        if (delProfileError) {
          return errorResponse(delProfileError.message, 500);
        }

        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          return jsonResponse({ warning: "Profile deleted but auth account remains. " + authDeleteError.message }, 207);
        }

        return jsonResponse({ success: true });
      }

      case "reset-password": {
        const { userId, newPassword } = body;
        if (!userId || !newPassword) {
          return errorResponse("Missing required fields: userId, newPassword");
        }

        const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
        if (resetError) {
          return errorResponse(resetError.message, 500);
        }

        return jsonResponse({ success: true });
      }

      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
