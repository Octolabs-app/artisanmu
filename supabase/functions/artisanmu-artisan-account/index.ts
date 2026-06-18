import { createClient } from "npm:@supabase/supabase-js@2.107.0";

// Self-contained artisan self-service account function (no _shared import):
// deactivate (reversible hide), reactivate, or permanently delete the account.
// Authed by the artisan's own Supabase session JWT.

const allowedOrigins = (
  Deno.env.get("ARTIZAN_ALLOWED_ORIGINS") ||
  "https://artizanmoris.octolabs.app,https://artisanmu.octolabs.app,http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeadersFor(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (!origin) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

const portfolioMarker = "/storage/v1/object/public/portfolios/";

type AccountBody = {
  action?: "deactivate" | "reactivate" | "delete";
};

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

function parsePhotos(raw: string | null) {
  if (!raw?.trim()) return [] as string[];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter((item) => item.startsWith("http"));
      }
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http"));
}

function pathFromPortfolioUrl(value: string) {
  const index = value.indexOf(portfolioMarker);
  if (index === -1) return null;
  return decodeURIComponent(value.slice(index + portfolioMarker.length));
}

Deno.serve(async (request: Request) => {
  const cors = corsHeadersFor(request);
  const json = (data: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    });

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
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

    const body = (await request.json().catch(() => ({}))) as AccountBody;
    const action = body.action;

    const { data: artisan, error: lookupError } = await admin
      .from("artisans")
      .select("id, photos")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();
    if (lookupError) return json({ error: "lookup_failed", message: lookupError.message }, 500);
    if (!artisan) return json({ error: "artisan_not_found", message: "No artisan profile for this account." }, 404);

    const artisanId = artisan.id;

    if (action === "deactivate") {
      const { error } = await admin
        .from("artisans")
        .update({ deactivated_at: new Date().toISOString(), is_available_today: false })
        .eq("id", artisanId);
      if (error) return json({ error: "deactivate_failed", message: error.message }, 500);
      await admin.from("audit_logs").insert({
        artisan_id: artisanId,
        event: "artisan_self_deactivate",
        metadata: { source: "artisanmu-artisan-account" },
      });
      return json({ success: true, deactivated: true });
    }

    if (action === "reactivate") {
      const { error } = await admin
        .from("artisans")
        .update({ deactivated_at: null })
        .eq("id", artisanId);
      if (error) return json({ error: "reactivate_failed", message: error.message }, 500);
      await admin.from("audit_logs").insert({
        artisan_id: artisanId,
        event: "artisan_self_reactivate",
        metadata: { source: "artisanmu-artisan-account" },
      });
      return json({ success: true, deactivated: false });
    }

    if (action === "delete") {
      // 1) Release any jobs this artisan currently holds so the FK clears + work reopens.
      await admin
        .from("job_requests")
        .update({ status: "open", claimed_by_artisan_id: null, claimed_at: null, contact_revealed_at: null })
        .eq("claimed_by_artisan_id", artisanId)
        .eq("status", "claimed");

      // 2) Durable audit record (artisan_id left null so it survives the row delete).
      await admin.from("audit_logs").insert({
        event: "artisan_self_delete",
        metadata: { source: "artisanmu-artisan-account", artisan_id: artisanId, auth_user: userData.user.id },
      });

      // 3) Remove dependent rows.
      await admin.from("job_notifications").delete().eq("artisan_id", artisanId);
      await admin.from("reviews").delete().eq("artisan_id", artisanId);

      // 4) Remove portfolio objects from storage.
      const paths = parsePhotos(artisan.photos)
        .map((photoUrl) => pathFromPortfolioUrl(photoUrl))
        .filter((path): path is string => Boolean(path && path.startsWith("artisan-")));
      if (paths.length) {
        await admin.storage.from("portfolios").remove(paths);
      }

      // 5) Delete the artisan row, then the auth user.
      const { error: rowError } = await admin.from("artisans").delete().eq("id", artisanId);
      if (rowError) return json({ error: "delete_failed", message: rowError.message }, 500);
      await admin.auth.admin.deleteUser(userData.user.id);

      return json({ success: true, deleted: true });
    }

    return json({ error: "invalid_action", message: "Account action is not supported." }, 400);
  } catch (error) {
    return json({ error: "server_error", message: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
