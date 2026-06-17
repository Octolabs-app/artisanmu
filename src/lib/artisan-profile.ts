import { tradeImages } from "./mock-data";
import type { Artisan } from "./types";

export const publicArtisanSelect =
  "id,nom,metier,ville,district,tel,expertise,service_tags,bio,note_total,nombre_avis,is_available_today,is_verified,avatar,photos,initiales,contact_preference,has_fair_price_badge,has_fast_response_badge,has_top_rated_badge,verification_status,created_at";

export const ownArtisanProfileSelect =
  "id,nom,metier,ville,district,tel,lien,gps,expertise,service_tags,bio,note_total,nombre_avis,is_available_today,is_verified,avatar,photos,initiales,contact_preference,has_fair_price_badge,has_fast_response_badge,has_top_rated_badge,verification_status,application_email,created_at,auth_user_id";

export type SupabaseArtisanProfile = {
  id: number;
  nom: string | null;
  metier: string | null;
  ville: string | null;
  district: string | null;
  tel: string | null;
  lien?: string | null;
  gps?: string | null;
  expertise: string | null;
  service_tags?: string[] | null;
  bio: string | null;
  note_total: number | null;
  nombre_avis: number | null;
  is_available_today: boolean | null;
  is_verified: boolean | null;
  avatar: string | null;
  photos?: string | null;
  initiales?: string | null;
  contact_preference?: string | null;
  has_fair_price_badge?: boolean | null;
  has_fast_response_badge?: boolean | null;
  has_top_rated_badge?: boolean | null;
  verification_status?: "pending" | "approved" | "rejected" | "removed" | null;
  application_email?: string | null;
  created_at?: string | null;
  auth_user_id?: string | null;
};

function parsePortfolioImages(rawPhotos?: string | null) {
  if (!rawPhotos?.trim()) return [];

  const trimmed = rawPhotos.trim();
  let values: unknown[] | null = null;

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) values = parsed;
    } catch {
      values = null;
    }
  }

  const candidates = values || trimmed.split(/[\n,;]+/);

  return candidates
    .map((item) => String(item).trim())
    .filter((item) => item.startsWith("http") || item.startsWith("/"))
    .slice(0, 8);
}

export function mapSupabaseArtisan(row: SupabaseArtisanProfile): Artisan {
  const reviews = row.nombre_avis || 0;
  const rating = reviews > 0 ? (row.note_total || 0) / reviews : 4.6;
  const avatarImage = row.avatar && row.avatar.startsWith("http") ? row.avatar : "";
  const profileImage = avatarImage || tradeImages[row.metier || ""] || tradeImages.default;
  const portfolioImages = parsePortfolioImages(row.photos).filter((image) => image !== profileImage);
  const badges = [
    row.is_verified ? "Verified" : "",
    row.has_fair_price_badge ? "Fair price" : "",
    row.has_fast_response_badge ? "Fast response" : "",
    row.has_top_rated_badge ? "Top rated" : "",
  ].filter(Boolean);

  return {
    id: String(row.id),
    name: row.nom || "Artisan",
    trade: row.metier || "Artisan",
    town: row.ville || "Maurice",
    district: row.district || "Maurice",
    rating: Number(rating.toFixed(1)),
    reviews,
    available: !!row.is_available_today,
    etaMinutes: row.is_available_today ? 22 : 50,
    priceHint: "Quote after brief",
    verified: !!row.is_verified,
    specialties: (row.expertise || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8),
    serviceTags: Array.isArray(row.service_tags) ? row.service_tags.filter(Boolean).slice(0, 8) : [],
    bio: row.bio || "Profil verifie par Artizan Moris.",
    phone: row.tel || "",
    image: profileImage,
    portfolioImages,
    initials: row.initiales || undefined,
    contactPreference: row.contact_preference || undefined,
    profileUrl: row.lien || undefined,
    gps: row.gps || undefined,
    authUserId: row.auth_user_id || undefined,
    createdAt: row.created_at || undefined,
    badges,
    verificationStatus: row.verification_status || (row.is_verified ? "approved" : "pending"),
    applicationEmail: row.application_email || undefined,
  };
}
