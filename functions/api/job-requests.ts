import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PagesContext,
} from "../_lib/http";
import { customerDisplayName, encryptPhone, hashPhone, normalizeMauritiusWhatsapp } from "../_lib/privacy";
import { getServiceSupabase } from "../_lib/supabase";

type CreateJobBody = {
  urgency?: string;
  description?: string;
  trade?: string;
  district?: string;
  whatsapp_number?: string;
  photo_url?: string;
};

const allowedUrgency = ["urgent", "planned"];
const allowedTrades = [
  "Plumber",
  "Electrician",
  "Painter",
  "Carpenter",
  "AC technician",
  "Locksmith",
  "Other",
];
const allowedDistricts = [
  "Port Louis",
  "Curepipe",
  "Quatre Bornes",
  "Rose Hill",
  "Mahebourg",
  "Mahébourg",
  "Flacq",
  "Riviere du Rempart",
  "Rivière du Rempart",
  "Vacoas",
  "Phoenix",
  "Beau Bassin",
  "Grand Baie",
  "Souillac",
];

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `missing_${field}`, `${field} is required.`);
  }
  return value.trim();
}

function safePhotoPath(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const path = value.trim();
  if (!/^job-photos\/[a-f0-9-]{36}\/\d{13}-[\w.-]+$/i.test(path)) {
    throw new HttpError(400, "invalid_photo_path", "Photo upload path is invalid.");
  }
  return path;
}

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context: PagesContext) {
  try {
    const body = await readJsonBody<CreateJobBody>(context.request);
    const urgency = requireString(body.urgency, "urgency");
    const description = requireString(body.description, "description");
    const trade = requireString(body.trade, "trade");
    const district = requireString(body.district, "district");

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
      throw new HttpError(400, "invalid_district", "Choose a supported location.");
    }

    const e164Phone = normalizeMauritiusWhatsapp(body.whatsapp_number);
    const [phoneHash, encryptedPhone] = await Promise.all([
      hashPhone(context.env, e164Phone),
      encryptPhone(context.env, e164Phone),
    ]);
    const displayName = customerDisplayName();
    const now = Date.now();
    const expiresAt = new Date(
      now + (urgency === "urgent" ? 4 * 60 * 60 * 1000 : 72 * 60 * 60 * 1000),
    ).toISOString();
    const photoPath = safePhotoPath(body.photo_url);
    const supabase = getServiceSupabase(context.env);

    const { count } = await supabase
      .from("artisans")
      .select("id", { count: "exact", head: true })
      .eq("is_verified", true)
      .eq("district", district);

    const { data, error } = await supabase
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

    if (error || !data) {
      throw new HttpError(500, "job_insert_failed", error?.message || "Could not create job request.");
    }

    await supabase.from("job_events").insert({
      job_id: data.id,
      event: "created",
      metadata: { urgency, district, trade, has_photo: Boolean(photoPath) },
    });

    return jsonResponse({
      id: data.id,
      artisan_count_nearby: count || 0,
      estimated_response_minutes: urgency === "urgent" ? 18 : 90,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
