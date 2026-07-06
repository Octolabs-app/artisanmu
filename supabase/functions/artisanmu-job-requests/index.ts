import {
  adjacentDistricts,
  allowedDistricts,
  allowedTrades,
  allowedUrgency,
  canonicalDistrict,
  customerDisplayName,
  encryptPhone,
  errorResponse,
  getAdminSupabase,
  hashPhone,
  HttpError,
  jsonResponse,
  matchingDistricts,
  normalizeContactMethod,
  normalizeMauritiusWhatsapp,
  optionsResponse,
  readJsonBody,
  requireString,
  safePhotoPath,
  tradeAliases,
} from "../_shared/artisanmu.ts";

type CreateJobBody = {
  urgency?: string;
  description?: string;
  trade?: string;
  district?: string;
  whatsapp_number?: string;
  contact_method?: string;
  photo_url?: string;
  expiry_days?: number;
};

// The poster chooses how long the request stays visible (1–30 days). If it is
// not claimed/completed before then, it auto-expires and disappears from feeds.
function resolveExpiryDays(value: unknown, urgency: string) {
  const requested = Number(value);
  if (Number.isFinite(requested)) {
    return Math.min(30, Math.max(1, Math.round(requested)));
  }
  return urgency === "urgent" ? 2 : 7;
}

type ArtisanTarget = {
  id: number;
  auth_user_id: string | null;
  district: string | null;
  ville: string | null;
  metier: string | null;
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<CreateJobBody>(request);
    const urgency = requireString(body.urgency, "urgency");
    const description = requireString(body.description, "description");
    const trade = requireString(body.trade, "trade");
    const district = canonicalDistrict(requireString(body.district, "district"));

    if (!allowedUrgency.includes(urgency)) {
      throw new HttpError(400, "invalid_urgency", "Urgency must be urgent or planned.");
    }
    if (description.length < 10) {
      throw new HttpError(400, "description_too_short", "Describe the problem in at least 10 characters.");
    }
    if (!allowedTrades.includes(trade)) {
      throw new HttpError(400, "invalid_trade", "Choose a supported trade.");
    }
    if (!allowedDistricts.includes(district)) {
      throw new HttpError(400, "invalid_district", "Choose a supported district or island.");
    }

    const supabase = getAdminSupabase();
    const contactMethod = normalizeContactMethod(body.contact_method);
    const e164Phone = normalizeMauritiusWhatsapp(body.whatsapp_number);
    const [phoneHash, encryptedPhone] = await Promise.all([
      hashPhone(e164Phone),
      encryptPhone(e164Phone),
    ]);
    const displayName = customerDisplayName();
    const now = Date.now();
    const expiryDays = resolveExpiryDays(body.expiry_days, urgency);
    const expiresAt = new Date(now + expiryDays * 24 * 60 * 60 * 1000).toISOString();
    const photoPath = safePhotoPath(body.photo_url);

    const { data: targetPool, error: targetError } = await supabase
      .from("artisans")
      .select("id,auth_user_id,district,ville,metier")
      .eq("is_verified", true)
      .eq("verification_status", "approved")
      .not("auth_user_id", "is", null);

    if (targetError) {
      throw new HttpError(500, "target_lookup_failed", targetError.message);
    }

    const districts = matchingDistricts(district);
    const nearbyDistricts = adjacentDistricts(district);
    const trades = tradeAliases(trade);
    // Each target is tagged primary (same district) or nearby (adjacent district,
    // same trade only) so the artisan sees why the lead reached them.
    const targets = ((targetPool || []) as ArtisanTarget[])
      .map((artisan) => {
        if (!artisan.auth_user_id) return null;
        const tradeMatch = trade === "Other" || trades.includes(artisan.metier || "");
        if (!tradeMatch) return null;

        const inPrimary =
          districts.includes(artisan.district || "") || districts.includes(artisan.ville || "");
        // Nearby only for specific trades — never blast a whole region for "Other".
        const inNearby =
          trade !== "Other" && nearbyDistricts.includes(canonicalDistrict(artisan.district || ""));

        if (!inPrimary && !inNearby) return null;
        return { artisan, proximity: inPrimary ? "primary" : "nearby" };
      })
      .filter((entry): entry is { artisan: ArtisanTarget; proximity: string } => entry !== null);

    const { data: job, error: jobError } = await supabase
      .from("job_requests")
      .insert({
        category: trade,
        description,
        image_url: photoPath,
        budget_tier: "mid",
        district,
        town: district,
        client_name: displayName,
        customer_display_name: displayName,
        client_whatsapp: "protected",
        whatsapp_hash: phoneHash,
        whatsapp_encrypted: encryptedPhone.encrypted,
        whatsapp_iv: encryptedPhone.iv,
        photo_storage_path: photoPath,
        status: "open",
        urgency,
        contact_method: contactMethod,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new HttpError(500, "job_insert_failed", jobError?.message || "Could not create job request.");
    }

    if (targets.length) {
      const { error: notificationError } = await supabase.from("job_notifications").insert(
        targets.map(({ artisan, proximity }) => ({
          job_id: job.id,
          artisan_id: artisan.id,
          auth_user_id: artisan.auth_user_id,
          urgency,
          status: "pending",
          match_reason: {
            district,
            trade,
            proximity,
            matched_on: {
              district: artisan.district,
              town: artisan.ville,
              trade: artisan.metier,
            },
          },
        })),
      );

      if (notificationError) {
        throw new HttpError(500, "notification_insert_failed", notificationError.message);
      }
    }

    const primaryCount = targets.filter((entry) => entry.proximity === "primary").length;
    const nearbyCount = targets.length - primaryCount;

    await supabase.from("job_events").insert({
      job_id: job.id,
      event: "created",
      metadata: {
        urgency,
        district,
        trade,
        has_photo: Boolean(photoPath),
        contact_method: contactMethod,
        targeted_artisan_count: targets.length,
        primary_artisan_count: primaryCount,
        nearby_artisan_count: nearbyCount,
      },
    });

    return jsonResponse({
      id: job.id,
      artisan_count_nearby: nearbyCount,
      targeted_artisan_count: targets.length,
      estimated_response_minutes: urgency === "urgent" ? 18 : 90,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
