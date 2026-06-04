import {
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  requireString,
} from "../_shared/artisanmu.ts";

type SignUploadBody = {
  filename?: string;
  content_type?: string;
  size?: number;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const maxBytes = 5 * 1024 * 1024;

function safeFilename(value: string) {
  return value
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 90);
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

    if (!allowedTypes.includes(contentType)) {
      throw new HttpError(400, "invalid_file_type", "Upload a JPG, PNG, WebP, HEIC, or HEIF image.");
    }
    if (typeof body.size !== "number" || body.size <= 0 || body.size > maxBytes) {
      throw new HttpError(400, "invalid_file_size", "Upload an image under 5 MB.");
    }

    const path = `job-photos/${crypto.randomUUID()}/${Date.now()}-${filename}`;
    const { data, error } = await getAdminSupabase()
      .storage
      .from("job-photos")
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      throw new HttpError(500, "signed_upload_failed", error?.message || "Could not create upload URL.");
    }

    return jsonResponse({ signedUrl: data.signedUrl, token: data.token, path });
  } catch (error) {
    return errorResponse(error);
  }
});
