import {
  allowedDistricts,
  canonicalDistrict,
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  normalizeServiceTags,
  optionsResponse,
  readJsonBody,
  requireString,
  storagePublicUrl,
} from "../_shared/artisanmu.ts";

type ProfileBody = {
  action?: "update_profile" | "set_availability" | "add_application_photos";
  town?: string;
  district?: string;
  bio?: string;
  specialties?: string[] | string;
  service_tags?: string[] | string;
  contact_preference?: string;
  available?: boolean;
  paths?: string[];
};

type ArtisanRow = {
  id: number;
  ville: string | null;
  district: string | null;
  expertise: string | null;
  bio: string | null;
  service_tags: string[] | null;
  contact_preference: string | null;
  is_available_today: boolean;
  is_verified: boolean;
  verification_status: "pending" | "approved" | "rejected" | "removed";
  photos: string | null;
  avatar: string | null;
};

function normalizeTown(value: unknown) {
  const town = requireString(value, "town").replace(/\s+/g, " ");
  if (town.length < 2 || town.length > 80) {
    throw new HttpError(400, "invalid_town", "Enter your town or village.");
  }
  return town;
}

function normalizeBio(value: unknown) {
  const bio = requireString(value, "bio").replace(/\s+/g, " ");
  if (bio.length < 30 || bio.length > 700) {
    throw new HttpError(400, "invalid_bio", "Add a short bio between 30 and 700 characters.");
  }
  return bio;
}

function normalizeSpecialties(value: ProfileBody["specialties"]) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,;]+/)
      : [];
  const specialties = Array.from(
    new Set(
      rawItems
        .map((item) => String(item).trim().replace(/\s+/g, " "))
        .filter((item) => item.length >= 2 && item.length <= 40),
    ),
  ).slice(0, 8);

  if (!specialties.length) {
    throw new HttpError(400, "missing_specialties", "Add at least one specialty.");
  }

  return specialties;
}

function parsePhotos(raw: string | null) {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.startsWith("http"));
      }
    } catch {
      // Fall back to delimiter parsing.
    }
  }

  return trimmed
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http"));
}

async function ownArtisan(request: Request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new HttpError(401, "unauthorized", "A signed-in artisan is required.");
  }

  const supabase = getAdminSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    throw new HttpError(401, "invalid_session", "A valid artisan session is required.");
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("artisans")
    .select("id,ville,district,expertise,bio,service_tags,contact_preference,is_available_today,is_verified,verification_status,photos,avatar")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (artisanError || !artisan) {
    throw new HttpError(403, "artisan_profile_missing", "This login is not linked to an artisan profile.");
  }

  return artisan as ArtisanRow;
}

function ensureApproved(artisan: ArtisanRow) {
  if (!artisan.is_verified || artisan.verification_status !== "approved") {
    throw new HttpError(403, "artisan_not_verified", "Admin approval is required before editing the verified dashboard.");
  }
}

function normalizeApplicationPaths(value: unknown, artisanId: number) {
  if (!Array.isArray(value) || !value.length) {
    throw new HttpError(400, "missing_portfolio_paths", "Upload at least one work photo.");
  }

  const pathPattern = new RegExp(`^artisan-applications/${artisanId}/[a-f0-9-]{36}-\\d{13}-[^/]{1,120}$`, "i");
  const paths = Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (paths.length > 6) {
    throw new HttpError(400, "too_many_portfolio_images", "Upload up to 6 work photos at once.");
  }

  for (const path of paths) {
    if (!pathPattern.test(path)) {
      throw new HttpError(400, "invalid_portfolio_path", "Portfolio upload path is invalid.");
    }
  }

  return paths;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<ProfileBody>(request);
    const action = body.action || "update_profile";
    const supabase = getAdminSupabase();
    const artisan = await ownArtisan(request);

    if (action === "set_availability") {
      ensureApproved(artisan);
      if (typeof body.available !== "boolean") {
        throw new HttpError(400, "invalid_availability", "Availability must be true or false.");
      }

      const { error } = await supabase
        .from("artisans")
        .update({ is_available_today: body.available })
        .eq("id", artisan.id);

      if (error) throw new HttpError(500, "availability_update_failed", error.message);
      return jsonResponse({ success: true, available: body.available });
    }

    if (action === "add_application_photos") {
      if (["rejected", "removed"].includes(artisan.verification_status)) {
        throw new HttpError(403, "artisan_not_active", "This artisan application cannot receive new photos.");
      }

      const paths = normalizeApplicationPaths(body.paths, artisan.id);
      const newPhotos = paths.map((path) => storagePublicUrl("portfolios", path));
      const nextPhotos = Array.from(new Set([...parsePhotos(artisan.photos), ...newPhotos])).slice(0, 8);

      const { error } = await supabase
        .from("artisans")
        .update({
          photos: JSON.stringify(nextPhotos),
          avatar: artisan.avatar || nextPhotos[0] || null,
        })
        .eq("id", artisan.id);

      if (error) throw new HttpError(500, "application_photos_update_failed", error.message);

      await supabase.from("audit_logs").insert({
        artisan_id: artisan.id,
        event: "artisan_application_photos_uploaded",
        metadata: { source: "artisanmu-artisan-profile", added: newPhotos.length },
      });

      return jsonResponse({ success: true, photos: nextPhotos, avatar: artisan.avatar || nextPhotos[0] || null });
    }

    if (action !== "update_profile") {
      throw new HttpError(400, "invalid_action", "Profile action is not supported.");
    }

    ensureApproved(artisan);
    const district = canonicalDistrict(requireString(body.district, "district"));
    if (!allowedDistricts.includes(district)) {
      throw new HttpError(400, "invalid_district", "Choose a supported district or island.");
    }

    const specialties = normalizeSpecialties(body.specialties);
    const serviceTags = normalizeServiceTags(body.service_tags, true);
    const contactPreference = body.contact_preference === "phone" ? "phone" : "whatsapp";

    const { data, error } = await supabase
      .from("artisans")
      .update({
        ville: normalizeTown(body.town),
        district,
        bio: normalizeBio(body.bio),
        expertise: specialties.join(", "),
        service_tags: serviceTags,
        contact_preference: contactPreference,
      })
      .eq("id", artisan.id)
      .select("ville,district,bio,expertise,service_tags,contact_preference")
      .single();

    if (error || !data) {
      throw new HttpError(500, "profile_update_failed", error?.message || "Profile could not be saved.");
    }

    await supabase.from("audit_logs").insert({
      artisan_id: artisan.id,
      event: "artisan_profile_updated",
      metadata: { source: "artisanmu-artisan-profile", service_tags: serviceTags },
    });

    return jsonResponse({
      success: true,
      profile: {
        town: data.ville,
        district: data.district,
        bio: data.bio,
        specialties,
        serviceTags,
        contactPreference: data.contact_preference,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
