import {
  decryptPhone,
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  requireString,
  telLink,
  whatsappDeepLink,
} from "../_shared/artisanmu.ts";

type ClaimBody = {
  job_id?: string;
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      throw new HttpError(401, "unauthorized", "A signed-in artisan is required.");
    }

    const body = await readJsonBody<ClaimBody>(request);
    const jobId = requireString(body.job_id, "job_id");
    const supabase = getAdminSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      throw new HttpError(401, "invalid_session", "A valid artisan session is required.");
    }

    const { data: artisan, error: artisanError } = await supabase
      .from("artisans")
      .select("id,nom,is_verified,auth_user_id,verification_status")
      .eq("auth_user_id", userData.user.id)
      .eq("is_verified", true)
      .eq("verification_status", "approved")
      .maybeSingle();

    if (artisanError || !artisan) {
      throw new HttpError(403, "artisan_not_verified", "Only verified linked artisans can claim jobs.");
    }

    const { data: notification, error: notificationError } = await supabase
      .from("job_notifications")
      .select("id,status")
      .eq("job_id", jobId)
      .eq("artisan_id", artisan.id)
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (notificationError || !notification) {
      throw new HttpError(403, "not_targeted", "This job was not assigned to your artisan profile.");
    }

    if (!["pending", "read"].includes(notification.status)) {
      throw new HttpError(409, "already_handled", "This notification has already been handled.");
    }

    const now = new Date().toISOString();
    const { data: job, error: claimError } = await supabase
      .from("job_requests")
      .update({
        status: "claimed",
        claimed_by_artisan_id: artisan.id,
        claimed_at: now,
        contact_revealed_at: now,
      })
      .eq("id", jobId)
      .eq("status", "open")
      .gt("expires_at", now)
      .select("id,description,customer_display_name,contact_method,whatsapp_encrypted,whatsapp_iv")
      .maybeSingle();

    if (claimError) {
      throw new HttpError(500, "claim_failed", claimError.message);
    }
    if (!job) {
      await supabase
        .from("job_notifications")
        .update({ status: "expired" })
        .eq("job_id", jobId)
        .neq("status", "claimed");
      return jsonResponse({ success: false, reason: "already_claimed" }, 409);
    }

    if (!job.whatsapp_encrypted || !job.whatsapp_iv) {
      throw new HttpError(500, "contact_missing", "Protected contact details are missing.");
    }

    const phone = await decryptPhone(job.whatsapp_encrypted, job.whatsapp_iv);
    const displayName = job.customer_display_name || "Client";
    const message = `Bonjour ${displayName}, je suis ${artisan.nom} via ArtisanMu. Je peux vous aider avec: ${job.description}`;

    await Promise.all([
      supabase
        .from("job_notifications")
        .update({ status: "claimed", claimed_at: now, read_at: now })
        .eq("id", notification.id),
      supabase
        .from("job_notifications")
        .update({ status: "expired" })
        .eq("job_id", jobId)
        .neq("id", notification.id),
      supabase.from("job_events").insert({
        job_id: jobId,
        event: "claimed",
        artisan_id: artisan.id,
        metadata: { source: "artisanmu-claim-job" },
      }),
      supabase.from("audit_logs").insert({
        job_id: jobId,
        artisan_id: artisan.id,
        event: "contact_revealed",
        metadata: { source: "artisanmu-claim-job", auth_user: userData.user.id },
      }),
    ]);

    const contactMethod = job.contact_method === "call" ? "call" : "whatsapp";
    return jsonResponse({
      success: true,
      contact: {
        display_name: displayName,
        method: contactMethod,
        phone_link: telLink(phone),
        whatsapp_deep_link: contactMethod === "whatsapp" ? whatsappDeepLink(phone, message) : null,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
