import {
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  verifyAdminPassword,
} from "../_shared/artisanmu.ts";

type AdminArtisanBody = {
  admin_password?: string;
  action?: "list" | "approve" | "reject" | "remove" | "set_badges";
  artisan_id?: number | string;
  notes?: string;
  badges?: string[];
};

type AdminArtisanRow = {
  id: number;
  nom: string;
  tel: string;
  metier: string;
  ville: string;
  district: string | null;
  expertise: string | null;
  service_tags: string[] | null;
  bio: string | null;
  avatar: string | null;
  photos: string | null;
  note_total: number;
  nombre_avis: number;
  is_verified: boolean;
  verification_status: "pending" | "approved" | "rejected" | "removed";
  application_email: string | null;
  created_at: string;
  reviewed_at: string | null;
  verification_notes: string | null;
  has_fair_price_badge: boolean;
  has_fast_response_badge: boolean;
  has_top_rated_badge: boolean;
  is_available_today: boolean;
  auth_user_id: string | null;
};

const selectColumns = [
  "id",
  "nom",
  "tel",
  "metier",
  "ville",
  "district",
  "expertise",
  "service_tags",
  "bio",
  "avatar",
  "photos",
  "note_total",
  "nombre_avis",
  "is_verified",
  "verification_status",
  "application_email",
  "created_at",
  "reviewed_at",
  "verification_notes",
  "has_fair_price_badge",
  "has_fast_response_badge",
  "has_top_rated_badge",
  "is_available_today",
  "auth_user_id",
].join(",");

function parsePhotos(raw: string | null) {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Fall back to delimiter parsing.
    }
  }

  return trimmed
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function badgesFor(row: AdminArtisanRow) {
  return [
    row.is_verified ? "Verified" : "",
    row.has_fair_price_badge ? "Fair price" : "",
    row.has_fast_response_badge ? "Fast response" : "",
    row.has_top_rated_badge ? "Top rated" : "",
  ].filter(Boolean);
}

function formatRow(row: AdminArtisanRow) {
  const photos = parsePhotos(row.photos);
  const reviews = row.nombre_avis || 0;
  const rating = reviews > 0 ? Number(((row.note_total || 0) / reviews).toFixed(1)) : 0;

  return {
    id: String(row.id),
    name: row.nom,
    email: row.application_email || "",
    phone: row.tel,
    trade: row.metier,
    town: row.ville,
    district: row.district || row.ville,
    specialties: (row.expertise || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    serviceTags: Array.isArray(row.service_tags) ? row.service_tags.filter(Boolean) : [],
    bio: row.bio || "",
    photos,
    photoCount: photos.length,
    status: row.verification_status,
    verified: row.is_verified,
    available: row.is_available_today,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    notes: row.verification_notes || "",
    badges: badgesFor(row),
    badgeFlags: {
      fairPrice: row.has_fair_price_badge,
      fastResponse: row.has_fast_response_badge,
      topRated: row.has_top_rated_badge,
    },
    reviews,
    rating,
    hasAuthUser: Boolean(row.auth_user_id),
  };
}

function artisanIdFrom(value: unknown) {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "invalid_artisan_id", "A valid artisan id is required.");
  }
  return id;
}

function badgeUpdate(badges: unknown) {
  const values = Array.isArray(badges) ? badges.map((item) => String(item)) : [];
  return {
    has_fair_price_badge: values.includes("Fair price"),
    has_fast_response_badge: values.includes("Fast response"),
    has_top_rated_badge: values.includes("Top rated"),
  };
}

function notesFrom(value: unknown) {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, 500) || null;
}

async function loadArtisans() {
  const { data, error } = await getAdminSupabase()
    .from("artisans")
    .select(selectColumns)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new HttpError(500, "artisan_list_failed", error.message);
  }

  const rows = (data || []) as AdminArtisanRow[];
  const formatted = rows.map(formatRow);

  return {
    pending: formatted.filter((row) => row.status === "pending" && !row.verified),
    artisans: formatted.filter((row) => row.status !== "pending" || row.verified),
    metrics: {
      pending: formatted.filter((row) => row.status === "pending" && !row.verified).length,
      active: formatted.filter((row) => row.status === "approved" && row.verified).length,
      removed: formatted.filter((row) => row.status === "removed").length,
      rejected: formatted.filter((row) => row.status === "rejected").length,
    },
  };
}

async function ensureArtisanExists(id: number) {
  const { data, error } = await getAdminSupabase()
    .from("artisans")
    .select("id,verification_status,is_verified")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "artisan_lookup_failed", error.message);
  }
  if (!data) {
    throw new HttpError(404, "artisan_not_found", "Artisan application was not found.");
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<AdminArtisanBody>(request);
    await verifyAdminPassword(body.admin_password);

    const action = body.action || "list";
    const supabase = getAdminSupabase();

    if (action === "list") {
      return jsonResponse(await loadArtisans());
    }

    const artisanId = artisanIdFrom(body.artisan_id);
    await ensureArtisanExists(artisanId);
    const now = new Date().toISOString();

    if (action === "approve") {
      const { error } = await supabase
        .from("artisans")
        .update({
          is_verified: true,
          verification_status: "approved",
          reviewed_at: now,
          verification_notes: notesFrom(body.notes),
          ...badgeUpdate(body.badges),
        })
        .eq("id", artisanId);

      if (error) throw new HttpError(500, "artisan_approve_failed", error.message);
    } else if (action === "reject") {
      const { error } = await supabase
        .from("artisans")
        .update({
          is_verified: false,
          is_available_today: false,
          verification_status: "rejected",
          reviewed_at: now,
          verification_notes: notesFrom(body.notes),
        })
        .eq("id", artisanId);

      if (error) throw new HttpError(500, "artisan_reject_failed", error.message);
    } else if (action === "remove") {
      const { error } = await supabase
        .from("artisans")
        .update({
          is_verified: false,
          is_available_today: false,
          verification_status: "removed",
          reviewed_at: now,
          verification_notes: notesFrom(body.notes),
        })
        .eq("id", artisanId);

      if (error) throw new HttpError(500, "artisan_remove_failed", error.message);
    } else if (action === "set_badges") {
      const { error } = await supabase
        .from("artisans")
        .update({
          ...badgeUpdate(body.badges),
          reviewed_at: now,
          verification_notes: notesFrom(body.notes),
        })
        .eq("id", artisanId);

      if (error) throw new HttpError(500, "artisan_badge_failed", error.message);
    } else {
      throw new HttpError(400, "invalid_action", "Admin action is not supported.");
    }

    await supabase.from("audit_logs").insert({
      artisan_id: artisanId,
      event: `admin_artisan_${action}`,
      metadata: {
        source: "artisanmu-admin-artisans",
      },
    });

    return jsonResponse({ success: true, ...(await loadArtisans()) });
  } catch (error) {
    return errorResponse(error);
  }
});
