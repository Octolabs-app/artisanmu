import {
  decryptPhone,
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  requireString,
  whatsappDeepLink,
} from "../_shared/artisanmu.ts";

// Open jobs board: a verified artisan can list every open job island-wide and
// claim any one of them (first-come). Unlike artisanmu-claim-job this does NOT
// require a pre-existing targeted notification. Contact is only revealed on a
// successful claim, reusing the shared decryptPhone crypto core.

type OpenJobsBody = {
  action?: "list" | "claim" | "unclaim";
  job_id?: string;
};

type JobRow = {
  id: string;
  category: string | null;
  description: string | null;
  district: string | null;
  town: string | null;
  customer_display_name: string | null;
  status: string;
  urgency: string | null;
  created_at: string;
  expires_at: string | null;
};

const listColumns = [
  "id",
  "category",
  "description",
  "district",
  "town",
  "customer_display_name",
  "status",
  "urgency",
  "created_at",
  "expires_at",
].join(",");

async function requireArtisan(request: Request) {
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
    .select("id,nom,is_verified,auth_user_id,verification_status")
    .eq("auth_user_id", userData.user.id)
    .eq("is_verified", true)
    .eq("verification_status", "approved")
    .maybeSingle();

  if (artisanError || !artisan) {
    throw new HttpError(403, "artisan_not_verified", "Only verified artisans can use the job board.");
  }

  return { artisan, authUserId: userData.user.id };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<OpenJobsBody>(request);
    const action = body.action || "list";
    const { artisan, authUserId } = await requireArtisan(request);
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();

    if (action === "list") {
      const { data, error } = await supabase
        .from("job_requests")
        .select(listColumns)
        .eq("status", "open")
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        throw new HttpError(500, "open_jobs_list_failed", error.message);
      }

      const jobs = ((data || []) as JobRow[]).map((job) => ({
        id: job.id,
        shortId: job.id.slice(0, 8),
        trade: job.category || "Other",
        description: job.description || "",
        town: job.town || job.district || "Mauritius",
        district: job.district || job.town || "Mauritius",
        client: job.customer_display_name || "Client",
        urgency: job.urgency || "planned",
        createdAt: job.created_at,
        expiresAt: job.expires_at,
      }));

      return jsonResponse({ success: true, jobs });
    }

    const jobId = requireString(body.job_id, "job_id");

    if (action === "unclaim") {
      // Release a job the artisan claimed but can't do — reopen it for others.
      const { data: released, error: releaseError } = await supabase
        .from("job_requests")
        .update({ status: "open", claimed_by_artisan_id: null, claimed_at: null, contact_revealed_at: null })
        .eq("id", jobId)
        .eq("status", "claimed")
        .eq("claimed_by_artisan_id", artisan.id)
        .select("id")
        .maybeSingle();

      if (releaseError) {
        throw new HttpError(500, "unclaim_failed", releaseError.message);
      }
      if (!released) {
        return jsonResponse({ success: false, reason: "not_claimable" }, 409);
      }

      await Promise.all([
        supabase
          .from("job_notifications")
          .update({ status: "read", claimed_at: null })
          .eq("job_id", jobId)
          .eq("artisan_id", artisan.id),
        supabase.from("job_events").insert({
          job_id: jobId,
          event: "unclaimed",
          artisan_id: artisan.id,
          metadata: { source: "artisanmu-open-jobs" },
        }),
        supabase.from("audit_logs").insert({
          job_id: jobId,
          artisan_id: artisan.id,
          event: "unclaimed",
          metadata: { source: "artisanmu-open-jobs" },
        }),
      ]);

      return jsonResponse({ success: true });
    }

    if (action !== "claim") {
      throw new HttpError(400, "invalid_action", "Job board action is not supported.");
    }

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
      .select("id,description,customer_display_name,urgency,whatsapp_encrypted,whatsapp_iv")
      .maybeSingle();

    if (claimError) {
      throw new HttpError(500, "claim_failed", claimError.message);
    }
    if (!job) {
      return jsonResponse({ success: false, reason: "already_claimed" }, 409);
    }

    if (!job.whatsapp_encrypted || !job.whatsapp_iv) {
      throw new HttpError(500, "contact_missing", "Protected contact details are missing.");
    }

    const phone = await decryptPhone(job.whatsapp_encrypted, job.whatsapp_iv);
    const displayName = job.customer_display_name || "Client";
    const message = `Bonjour ${displayName}, je suis ${artisan.nom} via Artizan Moris. Je peux vous aider avec: ${job.description}`;

    // Record the claim in job_notifications so it also surfaces in the artisan's
    // existing claimed-jobs view. Reuse a row if the artisan was already targeted,
    // otherwise insert one (urgency + match_reason are NOT NULL).
    const { data: existing } = await supabase
      .from("job_notifications")
      .select("id")
      .eq("job_id", jobId)
      .eq("artisan_id", artisan.id)
      .maybeSingle();

    const notificationWrites = existing
      ? supabase
          .from("job_notifications")
          .update({ status: "claimed", claimed_at: now, read_at: now })
          .eq("id", existing.id)
      : supabase.from("job_notifications").insert({
          job_id: jobId,
          artisan_id: artisan.id,
          auth_user_id: authUserId,
          status: "claimed",
          urgency: job.urgency || "planned",
          match_reason: { source: "artisanmu-open-jobs" },
          claimed_at: now,
          read_at: now,
        });

    await Promise.all([
      notificationWrites,
      supabase
        .from("job_notifications")
        .update({ status: "expired" })
        .eq("job_id", jobId)
        .neq("artisan_id", artisan.id)
        .neq("status", "claimed"),
      supabase.from("job_events").insert({
        job_id: jobId,
        event: "claimed",
        artisan_id: artisan.id,
        metadata: { source: "artisanmu-open-jobs" },
      }),
      supabase.from("audit_logs").insert({
        job_id: jobId,
        artisan_id: artisan.id,
        event: "contact_revealed",
        metadata: { source: "artisanmu-open-jobs", auth_user: authUserId },
      }),
    ]);

    return jsonResponse({
      success: true,
      contact: {
        display_name: displayName,
        whatsapp_deep_link: whatsappDeepLink(phone, message),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
