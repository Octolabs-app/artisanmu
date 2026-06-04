import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  type PagesContext,
} from "../../../_lib/http";
import { buildWhatsappDeepLink, decryptPhone } from "../../../_lib/privacy";
import { getServiceSupabase } from "../../../_lib/supabase";

type ClaimedJob = {
  id: string;
  category: string;
  district: string;
  whatsapp_encrypted: string | null;
  whatsapp_iv: string | null;
};

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context: PagesContext<{ id?: string }>) {
  try {
    const jobId = context.params.id;
    if (!jobId) throw new HttpError(400, "missing_job_id", "Job id is required.");

    const authorization = context.request.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    const artisanId = Number(context.request.headers.get("x-artisan-id"));

    if (!token || !Number.isInteger(artisanId) || artisanId <= 0) {
      throw new HttpError(401, "unauthorized", "A signed-in claimed artisan is required.");
    }

    const supabase = getServiceSupabase(context.env);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new HttpError(401, "invalid_session", "A valid auth session is required.");
    }

    const { data, error } = await supabase
      .from("job_requests")
      .select("id,category,district,whatsapp_encrypted,whatsapp_iv")
      .eq("id", jobId)
      .eq("status", "claimed")
      .eq("claimed_by_artisan_id", artisanId)
      .single();

    if (error || !data) {
      throw new HttpError(403, "not_claimed_by_artisan", "This job is not claimed by this artisan.");
    }

    const job = data as ClaimedJob;
    if (!job.whatsapp_encrypted || !job.whatsapp_iv) {
      throw new HttpError(500, "contact_missing", "Protected contact details are missing.");
    }

    const e164Phone = await decryptPhone(context.env, job.whatsapp_encrypted, job.whatsapp_iv);
    const whatsappDeepLink = buildWhatsappDeepLink(e164Phone, job.category, job.district);

    await supabase.from("audit_logs").insert({
      job_id: job.id,
      artisan_id: artisanId,
      event: "contact_revealed",
      metadata: { source: "contact_endpoint", auth_user: userData.user.id },
    });

    return jsonResponse({ whatsapp_deep_link: whatsappDeepLink });
  } catch (error) {
    return errorResponse(error);
  }
}
