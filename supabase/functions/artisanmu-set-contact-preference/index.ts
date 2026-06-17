import { createClient } from "npm:@supabase/supabase-js@2.107.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function serviceKey() {
  const direct = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
  if (direct) return direct;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default || Object.values(parsed)[0] || "";
  } catch {
    return "";
  }
}

// Lets a signed-in artisan set whether their number is reachable on WhatsApp.
// contact_preference: "whatsapp" (default) | "call".
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthorized", message: "Sign in first." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const key = serviceKey();
    if (!url || !key) return json({ error: "missing_supabase_config" }, 500);

    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "unauthorized", message: "Invalid session." }, 401);

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const preference = body.has_whatsapp === false ? "call" : "whatsapp";

    const { error: updateError } = await admin
      .from("artisans")
      .update({ contact_preference: preference })
      .eq("auth_user_id", userData.user.id);

    if (updateError) return json({ error: "update_failed", message: updateError.message }, 500);

    return json({ success: true, contact_preference: preference });
  } catch (error) {
    return json({ error: "server_error", message: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
