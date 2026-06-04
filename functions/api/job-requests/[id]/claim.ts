import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PagesContext,
} from "../../../_lib/http";
import { buildWhatsappDeepLink, decryptPhone } from "../../../_lib/privacy";
import { getServiceSupabase } from "../../../_lib/supabase";

type ClaimBody = {
  artisan_id?: number | string;
};

type ClaimedJob = {
  id: string;
  category: string;
  district: string;
  customer_display_name: string | null;
  whatsapp_encrypted: string | null;
  whatsapp_iv: string | null;
};

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context: PagesContext<{ id?: string }>) {
  try {
    const jobId = context.params.id;
    if (!jobId) throw new HttpError(400, "missing_job_id", "Job id is required.");

    const body = await readJsonBody<ClaimBody>(context.request);
    const artisanId = Number(body.artisan_id);
    if (!Number.isInteger(artisanId) || artisanId <= 0) {
      throw new HttpError(400, "invalid_artisan", "A valid artisan id is required.");
    }

    const supabase = getServiceSupabase(context.env);
    const { data: artisan, error: artisanError } = await supabase
      .from("artisans")
      .select("id")
      .eq("id", artisanId)
      .eq("is_verified", true)
      .single();

    if (artisanError || !artisan) {
      throw new HttpError(403, "artisan_not_verified", "Only verified artisans can claim jobs.");
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("job_requests")
      .update({
        status: "claimed",
        claimed_by_artisan_id: artisanId,
        claimed_at: now,
        contact_revealed_at: now,
      })
      .eq("id", jobId)
      .eq("status", "open")
      .gt("expires_at", now)
      .select("id,category,district,customer_display_name,whatsapp_encrypted,whatsapp_iv")
      .maybeSingle();

    if (error) {
      throw new HttpError(500, "claim_failed", error.message);
    }

    if (!data) {
      return jsonResponse({ success: false, reason: "already_claimed" }, 409);
    }

    const job = data as ClaimedJob;
    if (!job.whatsapp_encrypted || !job.whatsapp_iv) {
      throw new HttpError(500, "contact_missing", "Protected contact details are missing.");
    }

    const e164Phone = await decryptPhone(context.env, job.whatsapp_encrypted, job.whatsapp_iv);
    const whatsappDeepLink = buildWhatsappDeepLink(e164Phone, job.category, job.district);

    await Promise.all([
      supabase.from("job_events").insert({
        job_id: job.id,
        event: "claimed",
        artisan_id: artisanId,
      }),
      supabase.from("audit_logs").insert({
        job_id: job.id,
        artisan_id: artisanId,
        event: "contact_revealed",
        metadata: { source: "claim" },
      }),
    ]);

    return jsonResponse({
      success: true,
      contact: {
        display_name: job.customer_display_name || "Client A.",
        whatsapp_deep_link: whatsappDeepLink,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
