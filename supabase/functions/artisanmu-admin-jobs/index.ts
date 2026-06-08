import {
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  verifyAdminPassword,
} from "../_shared/artisanmu.ts";

type AdminJobsBody = {
  admin_password?: string;
  action?: "list" | "expire" | "complete" | "delete_photo";
  job_id?: string;
};

type JobRow = {
  id: string;
  category: string | null;
  description: string | null;
  district: string | null;
  town: string | null;
  client_name: string | null;
  customer_display_name: string | null;
  status: "open" | "claimed" | "completed" | "expired" | string;
  urgency: "urgent" | "planned" | string | null;
  created_at: string;
  expires_at: string | null;
  claimed_at: string | null;
  claimed_by_artisan_id: number | null;
  photo_storage_path: string | null;
  image_url: string | null;
};

type NotificationRow = {
  job_id: string;
  status: string;
};

type ArtisanRow = {
  id: number;
  nom: string | null;
};

const jobColumns = [
  "id",
  "category",
  "description",
  "district",
  "town",
  "client_name",
  "customer_display_name",
  "status",
  "urgency",
  "created_at",
  "expires_at",
  "claimed_at",
  "claimed_by_artisan_id",
  "photo_storage_path",
  "image_url",
].join(",");

function jobIdFrom(value: unknown) {
  const id = typeof value === "string" ? value.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(400, "invalid_job_id", "A valid job id is required.");
  }
  return id;
}

function ageLabel(value: string) {
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return "Recently";
  const diffMinutes = Math.max(1, Math.round((Date.now() - created) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function summarizeNotifications(rows: NotificationRow[], jobId: string) {
  const ownRows = rows.filter((row) => row.job_id === jobId);
  return {
    total: ownRows.length,
    pending: ownRows.filter((row) => ["pending", "read"].includes(row.status)).length,
    claimed: ownRows.filter((row) => row.status === "claimed").length,
    expired: ownRows.filter((row) => row.status === "expired").length,
  };
}

function metricsFor(jobs: JobRow[]) {
  return {
    total: jobs.length,
    open: jobs.filter((job) => job.status === "open").length,
    claimed: jobs.filter((job) => job.status === "claimed").length,
    completed: jobs.filter((job) => job.status === "completed").length,
    expired: jobs.filter((job) => job.status === "expired").length,
    cleanup: jobs.filter((job) => Boolean(job.photo_storage_path) && ["completed", "expired"].includes(job.status)).length,
  };
}

async function loadJobs() {
  const supabase = getAdminSupabase();
  const { data: jobsData, error: jobsError } = await supabase
    .from("job_requests")
    .select(jobColumns)
    .order("created_at", { ascending: false })
    .limit(500);

  if (jobsError) {
    throw new HttpError(500, "job_list_failed", jobsError.message);
  }

  const jobs = (jobsData || []) as JobRow[];
  const jobIds = jobs.map((job) => job.id);
  const artisanIds = Array.from(
    new Set(jobs.map((job) => job.claimed_by_artisan_id).filter((id): id is number => typeof id === "number")),
  );

  let notifications: NotificationRow[] = [];
  if (jobIds.length) {
    const { data, error } = await supabase
      .from("job_notifications")
      .select("job_id,status")
      .in("job_id", jobIds);

    if (error) {
      throw new HttpError(500, "notification_list_failed", error.message);
    }
    notifications = (data || []) as NotificationRow[];
  }

  let artisans: ArtisanRow[] = [];
  if (artisanIds.length) {
    const { data, error } = await supabase
      .from("artisans")
      .select("id,nom")
      .in("id", artisanIds);

    if (error) {
      throw new HttpError(500, "artisan_lookup_failed", error.message);
    }
    artisans = (data || []) as ArtisanRow[];
  }

  const artisanById = new Map(artisans.map((artisan) => [artisan.id, artisan.nom || `Artisan #${artisan.id}`]));

  return {
    jobs: jobs.map((job) => {
      const notificationSummary = summarizeNotifications(notifications, job.id);
      return {
        id: job.id,
        shortId: job.id.slice(0, 8),
        trade: job.category || "Other",
        description: job.description || "",
        town: job.town || job.district || "Mauritius",
        district: job.district || job.town || "Mauritius",
        client: job.customer_display_name || job.client_name || "Client",
        status: job.status,
        urgency: job.urgency || "planned",
        assignedTo: job.claimed_by_artisan_id
          ? artisanById.get(job.claimed_by_artisan_id) || `Artisan #${job.claimed_by_artisan_id}`
          : "Unassigned",
        assignedArtisanId: job.claimed_by_artisan_id,
        createdAt: job.created_at,
        age: ageLabel(job.created_at),
        expiresAt: job.expires_at,
        claimedAt: job.claimed_at,
        hasPhoto: Boolean(job.photo_storage_path || job.image_url),
        photoStoragePath: job.photo_storage_path,
        cleanupEligible: Boolean(job.photo_storage_path) && ["completed", "expired"].includes(job.status),
        notificationCount: notificationSummary.total,
        pendingNotificationCount: notificationSummary.pending,
        claimedNotificationCount: notificationSummary.claimed,
      };
    }),
    metrics: metricsFor(jobs),
  };
}

async function ensureJob(id: string) {
  const { data, error } = await getAdminSupabase()
    .from("job_requests")
    .select("id,status,photo_storage_path,image_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "job_lookup_failed", error.message);
  }
  if (!data) {
    throw new HttpError(404, "job_not_found", "Job request was not found.");
  }
  return data as Pick<JobRow, "id" | "status" | "photo_storage_path" | "image_url">;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<AdminJobsBody>(request);
    await verifyAdminPassword(body.admin_password);

    const action = body.action || "list";
    const supabase = getAdminSupabase();

    if (action === "list") {
      return jsonResponse(await loadJobs());
    }

    const jobId = jobIdFrom(body.job_id);
    const job = await ensureJob(jobId);
    const now = new Date().toISOString();

    if (action === "expire") {
      if (!["open", "claimed"].includes(job.status)) {
        throw new HttpError(409, "job_not_expirable", "Only open or claimed jobs can be expired.");
      }

      const { error } = await supabase
        .from("job_requests")
        .update({ status: "expired", expires_at: now })
        .eq("id", jobId);

      if (error) throw new HttpError(500, "job_expire_failed", error.message);

      await supabase
        .from("job_notifications")
        .update({ status: "expired" })
        .eq("job_id", jobId)
        .in("status", ["pending", "read"]);
    } else if (action === "complete") {
      if (job.status !== "claimed") {
        throw new HttpError(409, "job_not_claimed", "Only claimed jobs can be completed.");
      }

      const { error } = await supabase
        .from("job_requests")
        .update({ status: "completed" })
        .eq("id", jobId);

      if (error) throw new HttpError(500, "job_complete_failed", error.message);
    } else if (action === "delete_photo") {
      if (job.photo_storage_path) {
        const { error: storageError } = await supabase.storage.from("job-photos").remove([job.photo_storage_path]);
        if (storageError) {
          throw new HttpError(500, "photo_delete_failed", storageError.message);
        }
      }

      const { error } = await supabase
        .from("job_requests")
        .update({ photo_storage_path: null, image_url: null })
        .eq("id", jobId);

      if (error) throw new HttpError(500, "photo_clear_failed", error.message);
    } else {
      throw new HttpError(400, "invalid_action", "Admin job action is not supported.");
    }

    await Promise.all([
      supabase.from("job_events").insert({
        job_id: jobId,
        event: `admin_${action}`,
        metadata: { source: "artisanmu-admin-jobs" },
      }),
      supabase.from("audit_logs").insert({
        job_id: jobId,
        event: `admin_job_${action}`,
        metadata: { source: "artisanmu-admin-jobs" },
      }),
    ]);

    return jsonResponse({ success: true, ...(await loadJobs()) });
  } catch (error) {
    return errorResponse(error);
  }
});
