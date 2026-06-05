import {
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
  photo_url?: string;
};

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
    const e164Phone = normalizeMauritiusWhatsapp(body.whatsapp_number);
    const [phoneHash, encryptedPhone] = await Promise.all([
      hashPhone(e164Phone),
      encryptPhone(e164Phone),
    ]);
    const displayName = customerDisplayName();
    const now = Date.now();
    const expiresAt = new Date(
      now + (urgency === "urgent" ? 4 * 60 * 60 * 1000 : 72 * 60 * 60 * 1000),
    ).toISOString();
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
    const trades = tradeAliases(trade);
    const targets = ((targetPool || []) as ArtisanTarget[]).filter((artisan) => {
      const districtMatch = districts.includes(artisan.district || "") || districts.includes(artisan.ville || "");
      const tradeMatch = trade === "Other" || trades.includes(artisan.metier || "");
      return districtMatch && tradeMatch && artisan.auth_user_id;
    });

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
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new HttpError(500, "job_insert_failed", jobError?.message || "Could not create job request.");
    }

    if (targets.length) {
      const { error: notificationError } = await supabase.from("job_notifications").insert(
        targets.map((artisan) => ({
          job_id: job.id,
          artisan_id: artisan.id,
          auth_user_id: artisan.auth_user_id,
          urgency,
          status: "pending",
          match_reason: {
            district,
            trade,
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

    await supabase.from("job_events").insert({
      job_id: job.id,
      event: "created",
      metadata: {
        urgency,
        district,
        trade,
        has_photo: Boolean(photoPath),
        targeted_artisan_count: targets.length,
      },
    });

    return jsonResponse({
      id: job.id,
      artisan_count_nearby: targets.length,
      targeted_artisan_count: targets.length,
      estimated_response_minutes: urgency === "urgent" ? 18 : 90,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
