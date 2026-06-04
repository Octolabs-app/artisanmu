import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PagesContext,
} from "../../_lib/http";
import { getServiceSupabase } from "../../_lib/supabase";

type SignUploadBody = {
  filename?: string;
  content_type?: string;
  size?: number;
};

const allowedContentTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
]);

function safeFilename(value: string | undefined, extension: string) {
  const name = (value || "photo").replace(/[^a-z0-9._-]/gi, "-").slice(0, 56);
  if (!name || name === ".") return `photo${extension}`;
  return name.includes(".") ? name : `${name}${extension}`;
}

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context: PagesContext) {
  try {
    const body = await readJsonBody<SignUploadBody>(context.request);
    const contentType = body.content_type || "image/jpeg";
    const extension = allowedContentTypes.get(contentType);

    if (!extension) {
      throw new HttpError(400, "unsupported_file_type", "Upload an image file.");
    }

    if (typeof body.size === "number" && body.size > 5 * 1024 * 1024) {
      throw new HttpError(400, "file_too_large", "Upload an image under 5 MB.");
    }

    const fileName = safeFilename(body.filename, extension);
    const path = `job-photos/${crypto.randomUUID()}/${Date.now()}-${fileName}`;
    const supabase = getServiceSupabase(context.env);
    const { data, error } = await supabase.storage
      .from("job-photos")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data) {
      throw new HttpError(
        500,
        "signed_upload_failed",
        error?.message || "Could not create signed upload URL.",
      );
    }

    return jsonResponse({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      expires_in: 7200,
      requested_expires_in: 300,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
