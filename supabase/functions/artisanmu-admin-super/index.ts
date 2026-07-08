import { createClient } from "npm:@supabase/supabase-js@2.107.0";

// Self-contained SUPERADMIN function (mirrors artisanmu-admin-content's
// pattern: origin-allowlist CORS, non-throwing verifyAdmin, service key).
// Gives the founder full control: edit/delete any job request, set any job
// status, edit any artisan profile field, and read the monthly analytics +
// audit trail produced by the self-maintenance cron.

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

const adminPasswordHashFallback =
  "fe3ffd2d9a9aaced48c32c451afd6c81ca0a68beb6873dbcb3717755a0150bd9";

type SuperBody = {
  admin_password?: string;
  action?: "update_job" | "set_job_status" | "delete_job" | "update_artisan" | "stats";
  job_id?: string;
  artisan_id?: number | string;
  status?: string;
  patch?: Record<string, unknown>;
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

// ── validators (replicated from _shared so this fn stays self-contained) ──

const allowedUrgency = ["urgent", "planned"];
const allowedJobStatus = ["open", "claimed", "completed", "expired"];
const allowedTrades = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Mason", "AC technician",
  "Locksmith", "Gardener", "Plombier", "Electricien", "Électricien", "Peintre",
  "Menuisier", "Macon", "Maçon", "Climatisation", "Serrurier", "Jardinier", "Other",
];

const districtAliases: Record<string, string[]> = {
  "Port Louis": ["Port Louis", "Port-Louis"],
  Pamplemousses: ["Pamplemousses"],
  "Riviere du Rempart": ["Riviere du Rempart", "Rivière du Rempart", "Grand Baie"],
  Flacq: ["Flacq"],
  "Grand Port": ["Grand Port", "Mahebourg", "Mahébourg"],
  Savanne: ["Savanne", "Souillac"],
  "Plaines Wilhems": [
    "Plaines Wilhems", "Plaine Wilhems", "Curepipe", "Quatre Bornes",
    "Rose Hill", "Vacoas", "Phoenix", "Beau Bassin",
  ],
  Moka: ["Moka"],
  "Black River": ["Black River", "Riviere Noire", "Rivière Noire"],
  Rodrigues: ["Rodrigues", "Port Mathurin"],
};

function keyFor(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalDistrict(value: string) {
  const candidateKey = keyFor(value);
  for (const [district, aliases] of Object.entries(districtAliases)) {
    if (aliases.some((alias) => keyFor(alias) === candidateKey)) return district;
  }
  return "";
}

function normalizeMauritiusPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("230") ? digits.slice(3) : digits;
  if (!/^[24579]\d{7}$/.test(local)) return null;
  return `+230${local}`;
}

function intId(value: unknown) {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function uuidOf(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function cleanString(value: unknown, max: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned || cleaned.length > max) return undefined;
  return cleaned;
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

  let body: SuperBody;
  try {
    body = (await request.json()) as SuperBody;
  } catch {
    return json({ error: "invalid_json", message: "The request body must be valid JSON." }, 400);
  }

  const auth = await verifyAdmin(body.admin_password);
  if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);

  const url = Deno.env.get("SUPABASE_URL");
  const key = serviceKey();
  if (!url || !key) return json({ error: "missing_supabase_config" }, 500);
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  async function audit(event: string, jobId: string | null, artisanId: number | null, metadata: Record<string, unknown>) {
    await supabase.from("audit_logs").insert({
      event,
      job_id: jobId,
      artisan_id: artisanId,
      metadata: { source: "artisanmu-admin-super", ...metadata },
    });
  }

  try {
    // ── update_job: patch any editable field of a job request ──
    if (body.action === "update_job") {
      const jobId = uuidOf(body.job_id);
      if (!jobId) return json({ error: "invalid_job_id", message: "A valid job id is required." }, 400);
      const patch = body.patch || {};
      const update: Record<string, unknown> = {};

      const description = cleanString(patch.description, 700);
      if (description) update.description = description;

      if (typeof patch.district === "string") {
        const district = canonicalDistrict(patch.district);
        if (!district) return json({ error: "invalid_district", message: "Unknown district." }, 400);
        update.district = district;
      }
      const town = cleanString(patch.town, 80);
      if (town) update.town = town;

      if (typeof patch.urgency === "string") {
        if (!allowedUrgency.includes(patch.urgency)) {
          return json({ error: "invalid_urgency", message: "Urgency must be urgent or planned." }, 400);
        }
        update.urgency = patch.urgency;
      }
      if (typeof patch.category === "string") {
        if (!allowedTrades.includes(patch.category)) {
          return json({ error: "invalid_trade", message: "Unknown trade." }, 400);
        }
        update.category = patch.category;
      }
      if (typeof patch.expires_at === "string") {
        const when = new Date(patch.expires_at);
        if (Number.isNaN(when.getTime())) {
          return json({ error: "invalid_expiry", message: "expires_at must be a valid date." }, 400);
        }
        update.expires_at = when.toISOString();
      }
      const displayName = cleanString(patch.customer_display_name, 60);
      if (displayName) update.customer_display_name = displayName;

      if (!Object.keys(update).length) {
        return json({ error: "empty_patch", message: "Nothing to update." }, 400);
      }

      const { data, error } = await supabase
        .from("job_requests")
        .update(update)
        .eq("id", jobId)
        .select("id,status,category,district,town,urgency,description,expires_at,customer_display_name")
        .single();
      if (error || !data) return json({ error: "job_update_failed", message: error?.message || "Job not found." }, 404);

      await audit("admin_super_job_update", jobId, null, { fields: Object.keys(update) });
      return json({ success: true, job: data });
    }

    // ── set_job_status: arbitrary transition, incl. reopen ──
    if (body.action === "set_job_status") {
      const jobId = uuidOf(body.job_id);
      if (!jobId) return json({ error: "invalid_job_id", message: "A valid job id is required." }, 400);
      if (typeof body.status !== "string" || !allowedJobStatus.includes(body.status)) {
        return json({ error: "invalid_status", message: "Status must be open, claimed, completed or expired." }, 400);
      }

      const update: Record<string, unknown> = { status: body.status };
      if (body.status === "open") {
        // Reopen: release any claimant and push the deadline forward so the
        // job doesn't instantly re-expire.
        update.claimed_by_artisan_id = null;
        update.claimed_at = null;
        update.contact_revealed_at = null;
        update.expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (body.status === "expired") {
        update.expires_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("job_requests")
        .update(update)
        .eq("id", jobId)
        .select("id,status,claimed_by_artisan_id,expires_at")
        .single();
      if (error || !data) return json({ error: "job_status_failed", message: error?.message || "Job not found." }, 404);

      if (body.status === "expired" || body.status === "completed") {
        await supabase
          .from("job_notifications")
          .update({ status: "expired" })
          .eq("job_id", jobId)
          .in("status", ["pending", "read"]);
      }

      await audit("admin_super_job_status", jobId, null, { status: body.status });
      return json({ success: true, job: data });
    }

    // ── delete_job: hard delete (children cascade) ──
    if (body.action === "delete_job") {
      const jobId = uuidOf(body.job_id);
      if (!jobId) return json({ error: "invalid_job_id", message: "A valid job id is required." }, 400);

      // Audit first — the FK sets audit_logs.job_id NULL after deletion.
      await audit("admin_super_job_delete", jobId, null, { job_id: jobId });

      const { error, count } = await supabase
        .from("job_requests")
        .delete({ count: "exact" })
        .eq("id", jobId);
      if (error) return json({ error: "job_delete_failed", message: error.message }, 500);
      if (!count) return json({ error: "job_not_found", message: "Job not found." }, 404);

      return json({ success: true, deleted: jobId });
    }

    // ── update_artisan: patch any editable profile field ──
    if (body.action === "update_artisan") {
      const artisanId = intId(body.artisan_id);
      if (!artisanId) return json({ error: "invalid_artisan_id", message: "A valid artisan id is required." }, 400);
      const patch = body.patch || {};
      const update: Record<string, unknown> = {};

      const nom = cleanString(patch.nom, 80);
      if (nom) update.nom = nom;

      if (typeof patch.tel === "string") {
        const phone = normalizeMauritiusPhone(patch.tel);
        if (!phone) return json({ error: "invalid_phone", message: "Enter a valid Mauritius phone number." }, 400);
        update.tel = phone;
      }
      if (typeof patch.metier === "string") {
        if (!allowedTrades.includes(patch.metier)) return json({ error: "invalid_trade", message: "Unknown trade." }, 400);
        update.metier = patch.metier;
      }
      if (typeof patch.district === "string") {
        const district = canonicalDistrict(patch.district);
        if (!district) return json({ error: "invalid_district", message: "Unknown district." }, 400);
        update.district = district;
      }
      const ville = cleanString(patch.ville, 80);
      if (ville) update.ville = ville;

      const bio = typeof patch.bio === "string" ? patch.bio.trim() : undefined;
      if (bio !== undefined) {
        if (bio.length < 30 || bio.length > 700) {
          return json({ error: "invalid_bio", message: "Bio must be 30–700 characters." }, 400);
        }
        update.bio = bio;
      }
      const expertise = cleanString(patch.expertise, 400);
      if (expertise) update.expertise = expertise;

      if (Array.isArray(patch.service_tags)) {
        const tags = Array.from(
          new Set(
            patch.service_tags
              .map((item) => String(item).trim().replace(/\s+/g, " "))
              .filter((item) => item.length >= 2 && item.length <= 34),
          ),
        ).slice(0, 8);
        if (tags.length) update.service_tags = tags;
      }

      if (typeof patch.application_email === "string") {
        const email = patch.application_email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
          return json({ error: "invalid_email", message: "Enter a valid email address." }, 400);
        }
        update.application_email = email;
      }
      if (typeof patch.is_available_today === "boolean") update.is_available_today = patch.is_available_today;
      if (typeof patch.is_verified === "boolean") update.is_verified = patch.is_verified;

      if (!Object.keys(update).length) {
        return json({ error: "empty_patch", message: "Nothing to update." }, 400);
      }

      const { data, error } = await supabase
        .from("artisans")
        .update(update)
        .eq("id", artisanId)
        .select("id,nom,tel,metier,ville,district,bio,expertise,service_tags,application_email,is_available_today,is_verified,verification_status")
        .single();
      if (error || !data) return json({ error: "artisan_update_failed", message: error?.message || "Artisan not found." }, 404);

      await audit("admin_super_artisan_update", null, artisanId, { fields: Object.keys(update) });
      return json({ success: true, artisan: data });
    }

    // ── stats: monthly analytics + live counts + audit trail ──
    if (body.action === "stats") {
      const [monthly, jobs, artisans, auditRows] = await Promise.all([
        supabase.from("monthly_stats").select("*").order("month", { ascending: false }).limit(12),
        supabase.from("job_requests").select("status"),
        supabase.from("artisans").select("verification_status,is_verified,deactivated_at"),
        supabase
          .from("audit_logs")
          .select('id,event,job_id,artisan_id,metadata,"timestamp"')
          .order("timestamp", { ascending: false })
          .limit(30),
      ]);

      const jobCounts: Record<string, number> = {};
      for (const row of jobs.data || []) {
        jobCounts[row.status] = (jobCounts[row.status] || 0) + 1;
      }
      const artisanCounts: Record<string, number> = { approved_live: 0 };
      for (const row of artisans.data || []) {
        artisanCounts[row.verification_status] = (artisanCounts[row.verification_status] || 0) + 1;
        if (row.is_verified && row.verification_status === "approved" && !row.deactivated_at) {
          artisanCounts.approved_live += 1;
        }
      }

      return json({
        success: true,
        monthly: (monthly.data || []).reverse(),
        live: { jobs: jobCounts, artisans: artisanCounts },
        audit: auditRows.data || [],
        retention: { completed: "48h", claimed: "7d", expired: "7d", cadence: "every 15 min" },
      });
    }

    return json({ error: "unknown_action", message: "Unsupported action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return json({ error: "server_error", message }, 500);
  }
});
