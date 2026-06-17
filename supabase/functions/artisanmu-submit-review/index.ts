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

// Public review submission for an approved artisan. Validates input, inserts a
// review, and bumps the artisan's rating aggregate (note_total / nombre_avis).
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = serviceKey();
    if (!url || !key) return json({ error: "missing_supabase_config" }, 500);

    const body = (await request.json().catch(() => ({}))) as {
      artisan_id?: number | string;
      rating?: number;
      comment?: string;
      author_name?: string;
    };

    const artisanId = Number(body.artisan_id);
    if (!Number.isInteger(artisanId) || artisanId <= 0) {
      return json({ error: "invalid_artisan", message: "Invalid artisan." }, 400);
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return json({ error: "invalid_rating", message: "Rating must be between 1 and 5 stars." }, 400);
    }

    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 600) : "";
    if (comment.length < 4) {
      return json({ error: "invalid_comment", message: "Add a short comment (at least 4 characters)." }, 400);
    }

    const rawName = typeof body.author_name === "string" ? body.author_name.trim().replace(/\s+/g, " ") : "";
    const authorName = (rawName || "Client").slice(0, 60);

    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: artisan, error: artisanError } = await admin
      .from("artisans")
      .select("id, note_total, nombre_avis, verification_status, is_verified")
      .eq("id", artisanId)
      .maybeSingle();

    if (artisanError) return json({ error: "lookup_failed", message: artisanError.message }, 500);
    if (!artisan || !artisan.is_verified || artisan.verification_status !== "approved") {
      return json({ error: "artisan_not_available", message: "This artisan can't be reviewed yet." }, 404);
    }

    const { error: insertError } = await admin.from("reviews").insert({
      artisan_id: artisanId,
      rating,
      comment,
      author_name: authorName,
    });

    if (insertError) return json({ error: "insert_failed", message: insertError.message }, 500);

    const nextTotal = (artisan.note_total || 0) + rating;
    const nextCount = (artisan.nombre_avis || 0) + 1;
    const { error: updateError } = await admin
      .from("artisans")
      .update({ note_total: nextTotal, nombre_avis: nextCount })
      .eq("id", artisanId);

    if (updateError) return json({ error: "aggregate_failed", message: updateError.message }, 500);

    return json({
      success: true,
      rating,
      average: Number((nextTotal / nextCount).toFixed(1)),
      reviews: nextCount,
    });
  } catch (error) {
    return json({ error: "server_error", message: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
