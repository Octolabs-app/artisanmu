import {
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  requireString,
  storagePublicUrl,
} from "../_shared/artisanmu.ts";

type SignUploadBody = {
  filename?: string;
  content_type?: string;
  size?: number;
  purpose?: "job" | "artisan-application" | "artisan-portfolio";
  application_id?: string;
};

const allowedJobTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const allowedPortfolioTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxBytes = 5 * 1024 * 1024;

function safeFilename(value: string) {
  return value
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 90);
}

function safeUuid(value: unknown) {
  if (typeof value !== "string") return crypto.randomUUID();
  const trimmed = value.trim().toLowerCase();
  return /^[a-f0-9-]{36}$/.test(trimmed) ? trimmed : crypto.randomUUID();
}

async function verifiedArtisanId(request: Request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new HttpError(401, "unauthorized", "A signed-in verified artisan is required.");
  }

  const supabase = getAdminSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    throw new HttpError(401, "invalid_session", "A valid artisan session is required.");
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("artisans")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .eq("is_verified", true)
    .eq("verification_status", "approved")
    .maybeSingle();

  if (artisanError || !artisan) {
    throw new HttpError(403, "artisan_not_verified", "Only verified artisans can upload portfolio work.");
  }

  return Number(artisan.id);
}

async function applicationArtisanId(request: Request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const supabase = getAdminSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    throw new HttpError(401, "invalid_session", "A valid artisan session is required.");
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("artisans")
    .select("id,verification_status")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (artisanError || !artisan) {
    throw new HttpError(403, "artisan_profile_missing", "Create an artisan application before uploading work photos.");
  }
  if (["rejected", "removed"].includes(String(artisan.verification_status))) {
    throw new HttpError(403, "artisan_not_active", "This artisan application cannot receive new photos.");
  }

  return Number(artisan.id);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<SignUploadBody>(request);
    const filename = safeFilename(requireString(body.filename, "filename"));
    const contentType = requireString(body.content_type, "content_type");
    const purpose = body.purpose || "job";

    if (typeof body.size !== "number" || body.size <= 0 || body.size > maxBytes) {
      throw new HttpError(400, "invalid_file_size", "Upload an image under 5 MB.");
    }

    let bucket = "job-photos";
    let path = `job-photos/${crypto.randomUUID()}/${Date.now()}-${filename}`;

    if (purpose === "job") {
      if (!allowedJobTypes.includes(contentType)) {
        throw new HttpError(400, "invalid_file_type", "Upload a JPG, PNG, WebP, HEIC, or HEIF image.");
      }
    } else if (purpose === "artisan-application") {
      if (!allowedPortfolioTypes.includes(contentType)) {
        throw new HttpError(400, "invalid_file_type", "Upload a JPG, PNG, WebP, or GIF image.");
      }
      const artisanId = await applicationArtisanId(request);
      bucket = "portfolios";
      path = artisanId
        ? `artisan-applications/${artisanId}/${crypto.randomUUID()}-${Date.now()}-${filename}`
        : `artisan-applications/${safeUuid(body.application_id)}/${Date.now()}-${filename}`;
    } else if (purpose === "artisan-portfolio") {
      if (!allowedPortfolioTypes.includes(contentType)) {
        throw new HttpError(400, "invalid_file_type", "Upload a JPG, PNG, WebP, or GIF image.");
      }
      const artisanId = await verifiedArtisanId(request);
      bucket = "portfolios";
      path = `artisan-portfolios/${artisanId}/${crypto.randomUUID()}-${Date.now()}-${filename}`;
    } else {
      throw new HttpError(400, "invalid_upload_purpose", "Upload purpose is not supported.");
    }

    const { data, error } = await getAdminSupabase()
      .storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      throw new HttpError(500, "signed_upload_failed", error?.message || "Could not create upload URL.");
    }

    return jsonResponse({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      bucket,
      publicUrl: bucket === "portfolios" ? storagePublicUrl(bucket, path) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
