import {
  allowedDistricts,
  allowedTrades,
  canonicalDistrict,
  errorResponse,
  getAdminSupabase,
  HttpError,
  jsonResponse,
  normalizeMauritiusWhatsapp,
  normalizeServiceTags,
  optionsResponse,
  readJsonBody,
  requireString,
  storagePublicUrl,
} from "../_shared/artisanmu.ts";

type RegisterArtisanBody = {
  name?: string;
  email?: string;
  password?: string;
  whatsapp?: string;
  trade?: string;
  district?: string;
  town?: string;
  bio?: string;
  specialties?: string[] | string;
  service_tags?: string[] | string;
  portfolio_paths?: string[];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const portfolioPathPattern = /^artisan-applications\/[a-f0-9-]{36}\/\d{13}-[^/]{1,120}$/i;

function normalizeEmail(value: unknown) {
  const email = requireString(value, "email").toLowerCase();
  if (!emailPattern.test(email) || email.length > 254) {
    throw new HttpError(400, "invalid_email", "Enter a valid email address.");
  }
  return email;
}

function normalizeName(value: unknown) {
  const name = requireString(value, "name").replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw new HttpError(400, "invalid_name", "Enter your full name.");
  }
  return name;
}

function normalizePassword(value: unknown) {
  const password = requireString(value, "password");
  if (password.length < 8) {
    throw new HttpError(400, "weak_password", "Use a password with at least 8 characters.");
  }
  return password;
}

function normalizeTown(value: unknown) {
  const town = requireString(value, "town").replace(/\s+/g, " ");
  if (town.length < 2 || town.length > 80) {
    throw new HttpError(400, "invalid_town", "Enter your town or village.");
  }
  return town;
}

function normalizeBio(value: unknown) {
  const bio = requireString(value, "bio").replace(/\s+/g, " ");
  if (bio.length < 30 || bio.length > 700) {
    throw new HttpError(400, "invalid_bio", "Add a short bio between 30 and 700 characters.");
  }
  return bio;
}

function normalizeSpecialties(value: RegisterArtisanBody["specialties"]) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,;]+/)
      : [];
  const specialties = Array.from(
    new Set(
      rawItems
        .map((item) => String(item).trim().replace(/\s+/g, " "))
        .filter((item) => item.length >= 2 && item.length <= 40),
    ),
  ).slice(0, 8);

  if (!specialties.length) {
    throw new HttpError(400, "missing_specialties", "Add at least one specialty.");
  }

  return specialties;
}

function normalizePortfolioPaths(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const paths = Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (!paths.length) {
    return [];
  }
  if (paths.length > 6) {
    throw new HttpError(400, "too_many_portfolio_images", "Upload up to 6 work photos for review.");
  }

  for (const path of paths) {
    if (!portfolioPathPattern.test(path)) {
      throw new HttpError(400, "invalid_portfolio_path", "Portfolio upload path is invalid.");
    }
  }

  return paths;
}

function initialsForName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let createdUserId = "";

  try {
    const body = await readJsonBody<RegisterArtisanBody>(request);
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const whatsapp = normalizeMauritiusWhatsapp(body.whatsapp);
    const trade = requireString(body.trade, "trade");
    const district = canonicalDistrict(requireString(body.district, "district"));
    const town = normalizeTown(body.town);
    const bio = normalizeBio(body.bio);
    const specialties = normalizeSpecialties(body.specialties);
    const serviceTags = normalizeServiceTags(body.service_tags, true);
    const portfolioPaths = normalizePortfolioPaths(body.portfolio_paths);

    if (!allowedTrades.includes(trade)) {
      throw new HttpError(400, "invalid_trade", "Choose a supported trade.");
    }
    if (!allowedDistricts.includes(district)) {
      throw new HttpError(400, "invalid_district", "Choose a supported location.");
    }

    const supabase = getAdminSupabase();
    const { data: existingApplication, error: existingError } = await supabase
      .from("artisans")
      .select("id")
      .ilike("application_email", email)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw new HttpError(500, "application_lookup_failed", existingError.message);
    }
    if (existingApplication) {
      throw new HttpError(409, "application_exists", "An artisan application already exists for this email.");
    }

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        source: "artisanmu-self-registration",
        name,
        trade,
        district,
      },
    });

    if (userError || !userData.user) {
      throw new HttpError(409, "auth_user_create_failed", userError?.message || "Could not create artisan login.");
    }

    createdUserId = userData.user.id;

    const photoUrls = portfolioPaths.map((path) => storagePublicUrl("portfolios", path));
    const { data: artisan, error: artisanError } = await supabase
      .from("artisans")
      .insert({
        nom: name,
        tel: whatsapp,
        nic: `SELF-REG-${createdUserId.slice(0, 8)}`,
        metier: trade,
        ville: town,
        district,
        expertise: specialties.join(", "),
        service_tags: serviceTags,
        bio,
        avatar: photoUrls[0] || null,
        photos: JSON.stringify(photoUrls),
        initiales: initialsForName(name),
        auth_user_id: createdUserId,
        application_email: email,
        verification_notes: portfolioPaths.length ? null : "Application created before work photos finished uploading.",
        is_verified: false,
        verification_status: "pending",
        is_available_today: false,
        contact_preference: "whatsapp",
      })
      .select("id,verification_status")
      .single();

    if (artisanError || !artisan) {
      await supabase.auth.admin.deleteUser(createdUserId);
      createdUserId = "";
      throw new HttpError(500, "profile_create_failed", artisanError?.message || "Could not create artisan profile.");
    }

    await supabase.from("audit_logs").insert({
      artisan_id: artisan.id,
      event: "artisan_application_created",
      metadata: {
        source: "artisanmu-register-artisan",
        auth_user: createdUserId,
        application_email: email,
        portfolio_count: photoUrls.length,
        service_tags: serviceTags,
      },
    });

    return jsonResponse({
      success: true,
      artisan_id: artisan.id,
      status: artisan.verification_status,
      message: portfolioPaths.length
        ? "Application received. You can log in, but the full dashboard opens after admin approval."
        : "Application received. Work photos can keep uploading while your account waits for admin approval.",
    });
  } catch (error) {
    if (createdUserId) {
      try {
        await getAdminSupabase().auth.admin.deleteUser(createdUserId);
      } catch {
        // Best effort cleanup only.
      }
    }
    return errorResponse(error);
  }
});
