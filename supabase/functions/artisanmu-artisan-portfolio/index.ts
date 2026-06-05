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

type PortfolioBody = {
  action?: "add" | "remove";
  paths?: string[];
  photo_url?: string;
};

type ArtisanRow = {
  id: number;
  photos: string | null;
  avatar: string | null;
};

const maxPortfolioImages = 8;

function parsePhotos(raw: string | null) {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.startsWith("http"));
      }
    } catch {
      // Fall back to delimiter parsing.
    }
  }

  return trimmed
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http"));
}

function pathFromPortfolioUrl(value: string) {
  const marker = "/storage/v1/object/public/portfolios/";
  const index = value.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(value.slice(index + marker.length));
}

async function verifiedArtisan(request: Request) {
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
    .select("id,photos,avatar")
    .eq("auth_user_id", userData.user.id)
    .eq("is_verified", true)
    .eq("verification_status", "approved")
    .maybeSingle();

  if (artisanError || !artisan) {
    throw new HttpError(403, "artisan_not_verified", "Only verified artisans can manage portfolio photos.");
  }

  return artisan as ArtisanRow;
}

function normalizePortfolioPaths(value: unknown, artisanId: number) {
  if (!Array.isArray(value) || !value.length) {
    throw new HttpError(400, "missing_portfolio_paths", "Upload at least one portfolio photo.");
  }

  const pathPattern = new RegExp(`^artisan-portfolios/${artisanId}/[a-f0-9-]{36}-\\d{13}-[^/]{1,120}$`, "i");
  const paths = Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (paths.length > 6) {
    throw new HttpError(400, "too_many_portfolio_images", "Upload up to 6 photos at once.");
  }

  for (const path of paths) {
    if (!pathPattern.test(path)) {
      throw new HttpError(400, "invalid_portfolio_path", "Portfolio upload path is invalid.");
    }
  }

  return paths;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJsonBody<PortfolioBody>(request);
    const action = body.action || "add";
    const supabase = getAdminSupabase();
    const artisan = await verifiedArtisan(request);
    const currentPhotos = parsePhotos(artisan.photos);

    if (action === "remove") {
      const photoUrl = requireString(body.photo_url, "photo_url");
      const nextPhotos = currentPhotos.filter((item) => item !== photoUrl);
      if (nextPhotos.length === currentPhotos.length) {
        throw new HttpError(404, "photo_not_found", "Portfolio photo was not found.");
      }

      const removedPath = pathFromPortfolioUrl(photoUrl);
      const { error } = await supabase
        .from("artisans")
        .update({
          photos: JSON.stringify(nextPhotos),
          avatar: nextPhotos[0] || null,
        })
        .eq("id", artisan.id);

      if (error) {
        throw new HttpError(500, "portfolio_update_failed", error.message);
      }

      if (removedPath?.startsWith(`artisan-portfolios/${artisan.id}/`)) {
        await supabase.storage.from("portfolios").remove([removedPath]);
      }

      return jsonResponse({ success: true, photos: nextPhotos, avatar: nextPhotos[0] || null });
    }

    if (action !== "add") {
      throw new HttpError(400, "invalid_action", "Portfolio action is not supported.");
    }

    const paths = normalizePortfolioPaths(body.paths, artisan.id);
    const newPhotos = paths.map((path) => storagePublicUrl("portfolios", path));
    const nextPhotos = Array.from(new Set([...currentPhotos, ...newPhotos])).slice(0, maxPortfolioImages);

    const { error } = await supabase
      .from("artisans")
      .update({
        photos: JSON.stringify(nextPhotos),
        avatar: artisan.avatar || nextPhotos[0] || null,
      })
      .eq("id", artisan.id);

    if (error) {
      throw new HttpError(500, "portfolio_update_failed", error.message);
    }

    await supabase.from("audit_logs").insert({
      artisan_id: artisan.id,
      event: "artisan_portfolio_updated",
      metadata: {
        source: "artisanmu-artisan-portfolio",
        added: newPhotos.length,
      },
    });

    return jsonResponse({ success: true, photos: nextPhotos, avatar: artisan.avatar || nextPhotos[0] || null });
  } catch (error) {
    return errorResponse(error);
  }
});
