import { createClient } from "npm:@supabase/supabase-js@2.107.0";

// Self-contained admin moderation function (no _shared import, mirroring the
// artisanmu-submit-review pattern). Handles review moderation and portfolio
// photo removal. Admin auth is a SHA-256 hash compare against ADMIN_PASSWORD_HASH
// — this is NOT the AES contact-crypto core, so reproducing the hash check here
// is safe and keeps the function self-contained.

// CORS allowlist (audit hardening). Defaults include the live + new brand
// domains and local dev; override via the ARTIZAN_ALLOWED_ORIGINS edge secret
// (comma-separated). Browser requests from other origins get no CORS header and
// are blocked at preflight; non-browser callers (no Origin) are allowed.
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

// Same fallback hash the shared core uses, so behaviour matches the existing
// admin functions until ADMIN_PASSWORD_HASH is set as an edge secret.
const adminPasswordHashFallback =
  "fe3ffd2d9a9aaced48c32c451afd6c81ca0a68beb6873dbcb3717755a0150bd9";

const portfolioMarker = "/storage/v1/object/public/portfolios/";

type AdminContentBody = {
  admin_password?: string;
  action?: "list_reviews" | "delete_review" | "set_review_visibility" | "delete_artisan_photo" | "deactivate_artisan" | "reactivate_artisan" | "delete_artisan";
  artisan_id?: number | string;
  review_id?: number | string;
  photo_url?: string;
  is_visible?: boolean;
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

async function sha256Hex(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyAdmin(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, status: 401, error: "missing_admin_password", message: "Admin password is required." };
  }
  const expected =
    Deno.env.get("ADMIN_PASSWORD_HASH") ||
    Deno.env.get("NEXT_PUBLIC_ADMIN_PASSWORD_HASH") ||
    adminPasswordHashFallback;
  const candidate = await sha256Hex(value.trim());
  if (candidate !== expected) {
    return { ok: false, status: 403, error: "admin_forbidden", message: "Admin password is invalid." };
  }
  return { ok: true } as const;
}

function intId(value: unknown) {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
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
      // fall through to delimiter parsing
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
    const url = Deno.env.get("SUPABASE_URL");
    const key = serviceKey();
    if (!url || !key) return json({ error: "missing_supabase_config" }, 500);

    const body = (await request.json().catch(() => ({}))) as AdminContentBody;

    const auth = await verifyAdmin(body.admin_password);
    if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);

    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const action = body.action || "list_reviews";

    if (action === "list_reviews") {
      let query = admin
        .from("reviews")
        .select("id, artisan_id, rating, comment, author_name, created_at, is_visible")
        .order("created_at", { ascending: false })
        .limit(200);

      const artisanId = intId(body.artisan_id);
      if (artisanId) query = query.eq("artisan_id", artisanId);

      const { data, error } = await query;
      if (error) return json({ error: "review_list_failed", message: error.message }, 500);
      return json({ success: true, reviews: data || [] });
    }

    if (action === "delete_review") {
      const reviewId = intId(body.review_id);
      if (!reviewId) return json({ error: "invalid_review_id", message: "A valid review id is required." }, 400);

      const { data: review, error: lookupError } = await admin
        .from("reviews")
        .select("id, artisan_id, rating")
        .eq("id", reviewId)
        .maybeSingle();
      if (lookupError) return json({ error: "review_lookup_failed", message: lookupError.message }, 500);
      if (!review) return json({ error: "review_not_found", message: "Review was not found." }, 404);

      const { error: deleteError } = await admin.from("reviews").delete().eq("id", reviewId);
      if (deleteError) return json({ error: "review_delete_failed", message: deleteError.message }, 500);

      // Reverse the aggregate that artisanmu-submit-review applies on insert.
      const { data: artisan } = await admin
        .from("artisans")
        .select("id, note_total, nombre_avis")
        .eq("id", review.artisan_id)
        .maybeSingle();

      if (artisan) {
        const nextTotal = Math.max(0, (artisan.note_total || 0) - (review.rating || 0));
        const nextCount = Math.max(0, (artisan.nombre_avis || 0) - 1);
        await admin
          .from("artisans")
          .update({ note_total: nextTotal, nombre_avis: nextCount })
          .eq("id", review.artisan_id);
      }

      await admin.from("audit_logs").insert({
        artisan_id: review.artisan_id,
        event: "admin_review_delete",
        metadata: { source: "artisanmu-admin-content", review_id: reviewId },
      });

      return json({ success: true, review_id: reviewId, artisan_id: review.artisan_id });
    }

    if (action === "set_review_visibility") {
      const reviewId = intId(body.review_id);
      if (!reviewId) return json({ error: "invalid_review_id", message: "A valid review id is required." }, 400);
      const isVisible = body.is_visible !== false; // default to visible unless explicitly false

      const { data: updated, error: updateError } = await admin
        .from("reviews")
        .update({ is_visible: isVisible })
        .eq("id", reviewId)
        .select("id, artisan_id, is_visible")
        .maybeSingle();
      if (updateError) return json({ error: "review_visibility_failed", message: updateError.message }, 500);
      if (!updated) return json({ error: "review_not_found", message: "Review was not found." }, 404);

      await admin.from("audit_logs").insert({
        artisan_id: updated.artisan_id,
        event: isVisible ? "admin_review_show" : "admin_review_hide",
        metadata: { source: "artisanmu-admin-content", review_id: reviewId },
      });

      return json({ success: true, review_id: reviewId, is_visible: updated.is_visible });
    }

    if (action === "delete_artisan_photo") {
      const artisanId = intId(body.artisan_id);
      if (!artisanId) return json({ error: "invalid_artisan_id", message: "A valid artisan id is required." }, 400);
      const photoUrl = typeof body.photo_url === "string" ? body.photo_url.trim() : "";
      if (!photoUrl) return json({ error: "missing_photo_url", message: "A photo url is required." }, 400);

      const { data: artisan, error: lookupError } = await admin
        .from("artisans")
        .select("id, photos, avatar")
        .eq("id", artisanId)
        .maybeSingle();
      if (lookupError) return json({ error: "artisan_lookup_failed", message: lookupError.message }, 500);
      if (!artisan) return json({ error: "artisan_not_found", message: "Artisan was not found." }, 404);

      const currentPhotos = parsePhotos(artisan.photos);
      const nextPhotos = currentPhotos.filter((item) => item !== photoUrl);
      if (nextPhotos.length === currentPhotos.length) {
        return json({ error: "photo_not_found", message: "Portfolio photo was not found." }, 404);
      }

      const { error: updateError } = await admin
        .from("artisans")
        .update({ photos: JSON.stringify(nextPhotos), avatar: nextPhotos[0] || null })
        .eq("id", artisanId);
      if (updateError) return json({ error: "photo_update_failed", message: updateError.message }, 500);

      const removedPath = pathFromPortfolioUrl(photoUrl);
      if (removedPath?.startsWith("artisan-portfolios/") || removedPath?.startsWith("artisan-applications/")) {
        await admin.storage.from("portfolios").remove([removedPath]);
      }

      await admin.from("audit_logs").insert({
        artisan_id: artisanId,
        event: "admin_photo_delete",
        metadata: { source: "artisanmu-admin-content" },
      });

      return json({ success: true, photos: nextPhotos, avatar: nextPhotos[0] || null });
    }

    if (action === "deactivate_artisan") {
      const artisanId = intId(body.artisan_id);
      if (!artisanId) return json({ error: "invalid_artisan_id", message: "A valid artisan id is required." }, 400);
      const { error: updateError } = await admin
        .from("artisans")
        .update({ deactivated_at: new Date().toISOString(), is_available_today: false })
        .eq("id", artisanId);
      if (updateError) return json({ error: "deactivate_failed", message: updateError.message }, 500);
      await admin.from("audit_logs").insert({
        artisan_id: artisanId,
        event: "admin_artisan_deactivate",
        metadata: { source: "artisanmu-admin-content" },
      });
      return json({ success: true, artisan_id: artisanId, deactivated: true });
    }

    if (action === "reactivate_artisan") {
      const artisanId = intId(body.artisan_id);
      if (!artisanId) return json({ error: "invalid_artisan_id", message: "A valid artisan id is required." }, 400);
      const { error: updateError } = await admin
        .from("artisans")
        .update({ deactivated_at: null })
        .eq("id", artisanId);
      if (updateError) return json({ error: "reactivate_failed", message: updateError.message }, 500);
      await admin.from("audit_logs").insert({
        artisan_id: artisanId,
        event: "admin_artisan_reactivate",
        metadata: { source: "artisanmu-admin-content" },
      });
      return json({ success: true, artisan_id: artisanId, deactivated: false });
    }

    if (action === "delete_artisan") {
      const artisanId = intId(body.artisan_id);
      if (!artisanId) return json({ error: "invalid_artisan_id", message: "A valid artisan id is required." }, 400);

      const { data: artisan, error: lookupError } = await admin
        .from("artisans")
        .select("id, photos, auth_user_id")
        .eq("id", artisanId)
        .maybeSingle();
      if (lookupError) return json({ error: "artisan_lookup_failed", message: lookupError.message }, 500);
      if (!artisan) return json({ error: "artisan_not_found", message: "Artisan not found." }, 404);

      // Release any claimed jobs.
      await admin
        .from("job_requests")
        .update({ status: "open", claimed_by_artisan_id: null, claimed_at: null, contact_revealed_at: null })
        .eq("claimed_by_artisan_id", artisanId)
        .eq("status", "claimed");

      // Durable audit record before row deletion.
      await admin.from("audit_logs").insert({
        event: "admin_artisan_delete",
        metadata: { source: "artisanmu-admin-content", artisan_id: artisanId, auth_user: artisan.auth_user_id },
      });

      // Remove dependent rows.
      await admin.from("job_notifications").delete().eq("artisan_id", artisanId);
      await admin.from("reviews").delete().eq("artisan_id", artisanId);

      // Remove portfolio objects from storage.
      const paths = parsePhotos(artisan.photos)
        .map((photoUrl) => pathFromPortfolioUrl(photoUrl))
        .filter((path): path is string => Boolean(path && path.startsWith("artisan-")));
      if (paths.length) {
        await admin.storage.from("portfolios").remove(paths);
      }

      // Delete artisan row then auth user.
      const { error: rowError } = await admin.from("artisans").delete().eq("id", artisanId);
      if (rowError) return json({ error: "delete_failed", message: rowError.message }, 500);
      if (artisan.auth_user_id) {
        await admin.auth.admin.deleteUser(artisan.auth_user_id);
      }

      return json({ success: true, deleted: true, artisan_id: artisanId });
    }

    return json({ error: "invalid_action", message: "Admin content action is not supported." }, 400);
  } catch (error) {
    return json(
      { error: "server_error", message: error instanceof Error ? error.message : "Unexpected error." },
      500,
    );
  }
});
